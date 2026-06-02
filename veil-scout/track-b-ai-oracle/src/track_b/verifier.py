from __future__ import annotations

from .chain_client import ChainClient
from .github_client import GitHubClient
from .models import ChainSnapshot, EvidenceBundle, GitHubSnapshot, ProjectConfig, VerificationReport


def verify_project(
    project: ProjectConfig,
    market_id: int,
    github_client: GitHubClient | None = None,
    chain_client: ChainClient | None = None,
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
        limitations.append("P0 verifier counts merged PRs only; it does not judge PR quality or production deployment.")
    else:
        raise ValueError(f"unsupported rule: {rule.type}")

    return VerificationReport(
        projectSlug=project.slug,
        marketId=market_id,
        passed=passed,
        rule=rule,
        observedMetrics=observed,
        evidence=EvidenceBundle(github=github_snapshot, chain=chain_snapshot),
        dataSourcesUsed=data_sources,
        dataSourceStatus=data_status,
        settlementRationale=rationale,
        limitations=limitations,
        error=error,
    )
