from track_b.analyst import analyze_project, clamp_probability
from track_b.models import ProjectConfig


def sample_project() -> ProjectConfig:
    return ProjectConfig.model_validate({
        "slug": "agentpay",
        "name": "AgentPay",
        "description": "Demo project",
        "github_repo": "openai/openai-python",
        "milestone": "Reach 10 verified events",
        "deadline": 1893456000,
        "verification_rule": {
            "type": "github_merged_prs",
            "target": 1,
            "github_repo": "openai/openai-python",
        },
    })


def test_clamp_probability() -> None:
    assert clamp_probability(0.0) == 0.05
    assert clamp_probability(1.0) == 0.95
    assert clamp_probability(0.64) == 0.64


def test_analyze_falls_back_without_api_key() -> None:
    report = analyze_project(sample_project(), github=None, model="gpt-4o-mini", api_key=None)
    assert report.probability == 0.5
    assert report.aiPriorProbability == 0.5
    assert report.aiPriorLabel == "AI Prior"
    assert report.confidence == "low"
    assert report.fallbackUsed is True
    assert report.provider == "openai"
    assert report.model == "gpt-4o-mini"
    assert report.promptVersion == "veil-scout-ai-prior-v1"
    assert len(report.inputDigest) == 64
    assert len(report.evidenceDigest) == 64
    assert "manual review required" in report.riskFlags
    assert "neutral AI Prior" in report.bearish[0]
