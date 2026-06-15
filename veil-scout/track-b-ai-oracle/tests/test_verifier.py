from track_b.models import ChainSnapshot, GitHubSnapshot, ProjectConfig
from track_b.verifier import verify_project


class FakeGitHub:
    def snapshot(self, repo: str):
        return GitHubSnapshot(repo=repo, merged_prs=3)


class FakeChain:
    def snapshot_event_count(self, address, from_block=0, to_block="latest", topic0=None):
        return ChainSnapshot(rpc_url="mock", contract_event_counts={address: 12}, latest_block=100)


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
