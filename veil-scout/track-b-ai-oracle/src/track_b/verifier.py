from __future__ import annotations

from .chain_client import ChainClient
from .github_client import GitHubClient
from .models import ChainSnapshot, EvidenceBundle, GitHubSnapshot, ProjectConfig, VerificationReport


def verify_project(
    project: ProjectConfig,
    market_id: int,
    github_client: GitHubClient | None = None,
    chain_client: ChainClient | None = None,
    milestone_id: str | None = None,
    recommended_release_amount: int | None = None,
) -> VerificationReport:
    rule = project.verification_rule
    data_sources: list[str] = []
    github_snapshot: GitHubSnapshot | None = None
    chain_snapshot: ChainSnapshot | None = None
    observed: dict[str, int | str | bool | None] = {"target": rule.target, "ruleType": rule.type}
    data_status: dict[str, str] = {}
    limitations: list[str] = []

    if rule.type == "contract_event_count":
        if chain_client is None:
            raise RuntimeError("chain_client is required for contract_event_count")
        contract = rule.contract
        assert contract is not None
        chain_snapshot = chain_client.snapshot_event_count(
            contract.address,
            contract.from_block,
            contract.to_block,
            contract.event_topic0,
        )
        data_sources.append("chain")
        observed_value = next(iter(chain_snapshot.contract_event_counts.values()), 0)
        observed["contract"] = contract.address
        observed["eventCount"] = observed_value
        observed["dataUnavailable"] = chain_snapshot.data_unavailable
        passed = (not chain_snapshot.data_unavailable) and observed_value >= rule.target
        error = chain_snapshot.error
        data_status["chain"] = "unavailable" if chain_snapshot.data_unavailable else "available"
        rationale = (
            f"Observed {observed_value} matching contract events for {contract.address}; "
            f"target is {rule.target}. Result is {'PASS' if passed else 'FAIL'}."
        )
        execution_summary = (
            f"Observed {observed_value} matching contract events against a target of {rule.target}; "
            f"{'recommend releasing the next fixed sponsor tranche' if passed else 'recommend pausing further release pending review'}."
        )
        limitations.append("P0 verifier counts matching logs only; it does not yet filter unique wallets or wash activity.")
    elif rule.type == "github_merged_prs":
        if github_client is None:
            raise RuntimeError("github_client is required for github_merged_prs")
        repo = rule.github_repo or project.github_repo
        assert repo is not None
        github_snapshot = github_client.snapshot(repo)
        data_sources.append("github")
        observed_value = github_snapshot.merged_prs or 0
        observed["githubRepo"] = repo
        observed["mergedPrs"] = observed_value
        observed["dataUnavailable"] = github_snapshot.data_unavailable
        passed = (not github_snapshot.data_unavailable) and observed_value >= rule.target
        error = github_snapshot.error
        data_status["github"] = "unavailable" if github_snapshot.data_unavailable else "available"
        rationale = (
            f"Observed {observed_value} merged pull requests for {repo}; "
            f"target is {rule.target}. Result is {'PASS' if passed else 'FAIL'}."
        )
        execution_summary = (
            f"Observed {observed_value} merged pull requests against a target of {rule.target}; "
            f"{'recommend releasing the next fixed sponsor tranche' if passed else 'recommend pausing further release pending review'}."
        )
        limitations.append("P0 verifier counts merged PRs only; it does not judge PR quality or production deployment.")
    else:
        raise ValueError(f"unsupported rule: {rule.type}")

    return VerificationReport(
        projectSlug=project.slug,
        marketId=market_id,
        milestoneId=milestone_id,
        passed=passed,
        recommendedReleaseAmount=recommended_release_amount if passed else 0,
        pauseRecommendation=not passed,
        executionSummary=execution_summary,
        rule=rule,
        observedMetrics=observed,
        evidence=EvidenceBundle(github=github_snapshot, chain=chain_snapshot),
        dataSourcesUsed=data_sources,
        dataSourceStatus=data_status,
        settlementRationale=rationale,
        limitations=limitations,
        error=error,
    )


def assess_milestone_release(
    project: ProjectConfig,
    market_id: int,
    vault_id: int,
    milestone_id: int,
    chain_client: ChainClient,
    github_client: GitHubClient | None = None,
    recommended_release_amount: int | None = None,
) -> VerificationReport:
    verification_chain = chain_client if project.verification_rule.type == "contract_event_count" else None
    report = verify_project(
        project,
        market_id,
        github_client=github_client,
        chain_client=verification_chain,
        milestone_id=milestone_id,
    )

    vault = chain_client.get_incubation_vault(vault_id)
    if vault["status"] != "ACTIVE":
        raise ValueError(f"vault {vault_id} is not ACTIVE")

    milestone = chain_client.get_incubation_milestone(vault_id, milestone_id)
    if milestone["released"]:
        raise ValueError(f"milestone {milestone_id} in vault {vault_id} is already released")

    fixed_release_amount = int(milestone["releaseAmount"])
    if report.passed:
        release_amount = (
            fixed_release_amount
            if recommended_release_amount is None
            else recommended_release_amount
        )
        if release_amount != fixed_release_amount:
            raise ValueError(
                "recommended release amount must match the fixed on-chain milestone amount"
            )
    else:
        release_amount = 0 if recommended_release_amount is None else recommended_release_amount
        if release_amount != 0:
            raise ValueError("failed verification cannot recommend a milestone release amount")

    reviewed_budget = chain_client.remaining_incubation_budget(vault_id)
    observed_metrics = dict(report.observedMetrics)
    observed_metrics.update(
        {
            "vaultStatus": vault["status"],
            "milestoneReleaseAmount": fixed_release_amount,
            "milestoneReleased": milestone["released"],
            "vaultRemainingBudget": reviewed_budget,
        }
    )
    execution_summary = (
        f"{report.executionSummary} "
        f"Milestone {milestone_id} is configured for a fixed release of {fixed_release_amount} sponsor units; "
        f"{'authorized reviewer may submit the release' if report.passed else 'authorized reviewer should hold or pause the release'}."
    )
    limitations = list(report.limitations)
    limitations.append(
        "Advisory only: an authorized ORACLE_ROLE reviewer must still decide whether to submit releaseMilestone."
    )
    trust_boundary = (
        "Advisory only. The oracle report does not move sponsor units automatically; "
        "an authorized ORACLE_ROLE reviewer must approve and submit releaseMilestone."
    )
    reviewer_action = {
        "contractAddress": chain_client.deployment["incubationVault"],
        "function": "releaseMilestone(uint256,uint256,string)",
        "args": [vault_id, milestone_id, execution_summary],
        "requiredRole": "ORACLE_ROLE",
    }

    return report.model_copy(
        update={
            "vaultId": vault_id,
            "milestoneId": milestone_id,
            "recommendedReleaseAmount": release_amount,
            "pauseRecommendation": not report.passed,
            "executionSummary": execution_summary,
            "observedMetrics": observed_metrics,
            "limitations": limitations,
            "trustBoundary": trust_boundary,
            "reviewerAction": reviewer_action,
            "releaseCommandPreview": chain_client.release_milestone_command_preview(
                vault_id, milestone_id, execution_summary
            ),
        }
    )
