from track_b.models import ChainSnapshot, GitHubSnapshot, ProjectConfig
from track_b.verifier import assess_milestone_release, verify_project


class FakeGitHub:
    def snapshot(self, repo: str, lookback_days: int = 30, as_of=None):
        assert lookback_days == 30
        assert as_of is not None
        return GitHubSnapshot(
            repo=repo,
            merged_prs=3,
            window_start="2029-12-02T00:00:00+00:00",
            window_end="2030-01-01T00:00:00+00:00",
        )


class UnavailableGitHub:
    def snapshot(self, repo: str, lookback_days: int = 30, as_of=None):
        return GitHubSnapshot(repo=repo, merged_prs=99, data_unavailable=True, error="rate limited")


class FakeChain:
    def snapshot_event_count(self, address, from_block=0, to_block="latest", topic0=None):
        return ChainSnapshot(rpc_url="mock", contract_event_counts={address: 12}, latest_block=100)

    deployment = {
        "incubationVault": "0x000000000000000000000000000000000000c0de",
        "deployer": "0x000000000000000000000000000000000000b0b0",
    }

    def get_incubation_vault(self, vault_id: int):
        assert vault_id == 3
        return {
            "status": "ACTIVE",
            "remainingBudget": 8_000,
        }

    def get_incubation_milestone(self, vault_id: int, milestone_id: int):
        assert vault_id == 3
        assert milestone_id == 1
        return {
            "label": "Demo milestone",
            "releaseAmount": 4_000,
            "metadataURI": "ipfs://milestones/m2",
            "released": False,
        }

    def remaining_incubation_budget(self, vault_id: int):
        assert vault_id == 3
        return 8_000

    def release_milestone_command_preview(
        self, vault_id: int, milestone_id: int, execution_summary: str
    ):
        return (
            f'cast send 0x000000000000000000000000000000000000c0de '
            f'"releaseMilestone(uint256,uint256,string)" {vault_id} {milestone_id} '
            f"--rpc-url $RPC_URL --unlocked --from 0x000000000000000000000000000000000000b0b0"
        )


def test_verify_github_merged_prs_passes() -> None:
    project = ProjectConfig.model_validate({
        "slug": "agentpay",
        "name": "AgentPay",
        "description": "Demo project",
        "milestone": "Merge 2 PRs",
        "deadline": 1893456000,
        "verification_rule": {
            "type": "github_merged_prs",
            "target": 2,
            "github_repo": "owner/repo",
        },
    })
    report = verify_project(
        project,
        7,
        github_client=FakeGitHub(),
        milestone_id="m1",
        recommended_release_amount=2500,
    )
    assert report.passed is True
    assert report.milestoneId == "m1"
    assert report.observedMetrics["mergedPrs"] == 3
    assert report.recommendedReleaseAmount == 2500
    assert report.pauseRecommendation is False
    assert "recommend releasing" in report.executionSummary
    assert report.dataSourceStatus["github"] == "available"
    assert "Result is PASS" in report.settlementRationale
    assert report.limitations


def test_verify_unavailable_github_never_passes() -> None:
    project = ProjectConfig.model_validate({
        "slug": "veil-scout",
        "name": "Veil Scout",
        "description": "Real project",
        "milestone": "Merge 1 PR",
        "deadline": 1893456000,
        "resolution_deadline": 1893456000,
        "verification_rule": {
            "type": "github_merged_prs",
            "target": 1,
            "lookbackDays": 30,
            "github_repo": "Lingke-H/htx-web3-hackathon",
        },
    })
    report = verify_project(project, 1, github_client=UnavailableGitHub())
    assert report.passed is False
    assert report.dataSourceStatus["github"] == "unavailable"
    assert report.observedMetrics["mergedPrs"] == 99


def test_verify_contract_event_count_passes() -> None:
    project = ProjectConfig.model_validate({
        "slug": "agentpay",
        "name": "AgentPay",
        "description": "Demo project",
        "milestone": "Emit 10 events",
        "deadline": 1893456000,
        "verification_rule": {
            "type": "contract_event_count",
            "target": 10,
            "contract": {"address": "0x0000000000000000000000000000000000000000"},
        },
    })
    report = verify_project(
        project,
        7,
        chain_client=FakeChain(),
        milestone_id="m2",
        recommended_release_amount=4000,
    )
    assert report.passed is True
    assert report.milestoneId == "m2"
    assert report.observedMetrics["eventCount"] == 12
    assert report.recommendedReleaseAmount == 4000
    assert report.pauseRecommendation is False
    assert "recommend releasing" in report.executionSummary
    assert report.dataSourceStatus["chain"] == "available"
    assert "Result is PASS" in report.settlementRationale
    assert report.limitations


def test_assess_milestone_release_builds_reviewer_guidance() -> None:
    project = ProjectConfig.model_validate({
        "slug": "agentpay",
        "name": "AgentPay",
        "description": "Demo project",
        "milestone": "Emit 10 events",
        "deadline": 1893456000,
        "verification_rule": {
            "type": "contract_event_count",
            "target": 10,
            "contract": {"address": "0x0000000000000000000000000000000000000000"},
        },
    })
    report = assess_milestone_release(
        project,
        7,
        3,
        1,
        chain_client=FakeChain(),
        recommended_release_amount=4_000,
    )
    assert report.vaultId == 3
    assert report.milestoneId == 1
    assert report.passed is True
    assert report.recommendedReleaseAmount == 4_000
    assert report.pauseRecommendation is False
    assert report.observedMetrics["milestoneReleaseAmount"] == 4_000
    assert report.observedMetrics["vaultStatus"] == "ACTIVE"
    assert "authorized ORACLE_ROLE reviewer" in report.trustBoundary
    assert "releaseMilestone" in report.releaseCommandPreview


def test_assess_milestone_release_rejects_mismatched_amount() -> None:
    project = ProjectConfig.model_validate({
        "slug": "agentpay",
        "name": "AgentPay",
        "description": "Demo project",
        "milestone": "Emit 10 events",
        "deadline": 1893456000,
        "verification_rule": {
            "type": "contract_event_count",
            "target": 10,
            "contract": {"address": "0x0000000000000000000000000000000000000000"},
        },
    })
    try:
        assess_milestone_release(
            project,
            7,
            3,
            1,
            chain_client=FakeChain(),
            recommended_release_amount=3_999,
        )
    except ValueError as exc:
        assert "fixed on-chain milestone amount" in str(exc)
    else:
        raise AssertionError("expected mismatched release amount to raise")
