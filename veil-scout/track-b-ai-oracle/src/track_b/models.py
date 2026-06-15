from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


Confidence = Literal["low", "medium", "high"]
RuleType = Literal["contract_event_count", "github_merged_prs"]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


class ContractSource(BaseModel):
    address: str
    event_topic0: str | None = None
    from_block: int | Literal["latest"] = 0
    to_block: int | Literal["latest"] = "latest"


class VerificationRule(BaseModel):
    type: RuleType
    target: int = Field(ge=0)
    contract: ContractSource | None = None
    github_repo: str | None = None

    @model_validator(mode="after")
    def validate_source(self) -> "VerificationRule":
        if self.type == "contract_event_count" and self.contract is None:
            raise ValueError("contract_event_count requires contract")
        if self.type == "github_merged_prs" and not self.github_repo:
            raise ValueError("github_merged_prs requires github_repo")
        return self


class ProjectConfig(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,63}$")
    name: str
    description: str
    github_repo: str | None = Field(default=None, description="owner/repo")
    contract_addresses: list[str] = Field(default_factory=list)
    milestone: str
    deadline: int = Field(description="Unix timestamp for the milestone deadline")
    season_id: int = 0
    trading_deadline: int | None = None
    resolution_deadline: int | None = None
    force_void_deadline: int | None = None
    project_owner: str = "0x0000000000000000000000000000000000001000"
    verification_rule: VerificationRule

    @field_validator("github_repo")
    @classmethod
    def normalize_repo(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.removeprefix("https://github.com/").strip("/")
        if cleaned.count("/") != 1:
            raise ValueError("github_repo must be owner/repo")
        return cleaned


class GitHubSnapshot(BaseModel):
    repo: str
    stars: int | None = None
    forks: int | None = None
    open_issues: int | None = None
    recent_commits: int | None = None
    merged_prs: int | None = None
    contributors: int | None = None
    latest_release: str | None = None
    latest_tag: str | None = None
    last_activity_at: str | None = None
    data_unavailable: bool = False
    error: str | None = None


class ChainSnapshot(BaseModel):
    rpc_url: str
    contract_event_counts: dict[str, int] = Field(default_factory=dict)
    latest_block: int | None = None
    data_unavailable: bool = False
    error: str | None = None


class EvidenceBundle(BaseModel):
    github: GitHubSnapshot | None = None
    chain: ChainSnapshot | None = None


class AIReport(BaseModel):
    projectSlug: str
    generatedAt: str = Field(default_factory=utc_now_iso)
    probability: float = Field(ge=0.05, le=0.95)
    aiPriorProbability: float | None = Field(default=None, ge=0.05, le=0.95)
    aiPriorLabel: str = "AI Prior"
    confidence: Confidence
    bullish: list[str] = Field(default_factory=list)
    bearish: list[str] = Field(default_factory=list)
    riskFlags: list[str] = Field(default_factory=list)
    settleable: bool
    dataSourcesUsed: list[str] = Field(default_factory=list)
    suggestedQuestion: str
    fallbackUsed: bool = False
    error: str | None = None
    evidence: EvidenceBundle | None = None

    @model_validator(mode="after")
    def default_ai_prior(self) -> "AIReport":
        if self.aiPriorProbability is None:
            self.aiPriorProbability = self.probability
        return self


class VerificationReport(BaseModel):
    projectSlug: str
    marketId: int
    vaultId: int | None = Field(default=None, ge=0)
    milestoneId: int | str | None = None
    passed: bool
    recommendedReleaseAmount: int | None = Field(default=None, ge=0)
    pauseRecommendation: bool = False
    executionSummary: str = ""
    rule: VerificationRule
    observedMetrics: dict[str, Any]
    evidence: EvidenceBundle | None = None
    checkedAt: str = Field(default_factory=utc_now_iso)
    dataSourcesUsed: list[str] = Field(default_factory=list)
    dataSourceStatus: dict[str, str] = Field(default_factory=dict)
    settlementRationale: str
    limitations: list[str] = Field(default_factory=list)
    trustBoundary: str | None = None
    reviewerAction: dict[str, Any] | None = None
    releaseCommandPreview: str | None = None
    error: str | None = None

    @model_validator(mode="after")
    def validate_release_guidance(self) -> "VerificationReport":
        release_amount = self.recommendedReleaseAmount or 0
        if not self.passed and release_amount != 0:
            raise ValueError("failed verification cannot recommend a positive release amount")
        if self.vaultId is not None and self.milestoneId is None:
            raise ValueError("vault-linked release reports require milestoneId")
        if self.releaseCommandPreview and self.vaultId is None:
            raise ValueError("release command preview requires vaultId")
        return self


class TxReceiptSummary(BaseModel):
    txHash: str
    blockNumber: int | None = None
    gasUsed: int | None = None
    status: int | None = None


class CreatedMarket(BaseModel):
    projectSlug: str
    marketId: int
    specHash: str
    metadataURI: str
    tx: TxReceiptSummary


def report_path(data_dir: Path, project_slug: str) -> Path:
    return data_dir / "reports" / f"{project_slug}-ai-report.json"


def verification_path(data_dir: Path, project_slug: str, market_id: int) -> Path:
    return data_dir / "settlements" / f"{project_slug}-verification-market-{market_id}.json"


def release_assessment_path(
    data_dir: Path, project_slug: str, market_id: int, vault_id: int, milestone_id: int
) -> Path:
    return (
        data_dir
        / "releases"
        / f"{project_slug}-market-{market_id}-vault-{vault_id}-milestone-{milestone_id}.json"
    )
