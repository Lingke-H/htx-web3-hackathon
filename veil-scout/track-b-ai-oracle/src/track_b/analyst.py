from __future__ import annotations

import json
from hashlib import sha256

from openai import OpenAI
from pydantic import ValidationError

from .models import AIReport, EvidenceBundle, GitHubSnapshot, ProjectConfig


SYSTEM_PROMPT = """You are Veil Scout's first analyst, not the final judge.
Analyze whether a Web3 project is likely to satisfy a binary milestone.
Return compact JSON only. The value is an AI Prior, not market price or odds.
AI Prior probability must be 0.05 to 0.95.
Do not claim certainty when data is missing."""

PROMPT_VERSION = "veil-scout-ai-prior-v1"


def canonical_digest(payload: object) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return sha256(encoded.encode("utf-8")).hexdigest()


def analyze_project(
    project: ProjectConfig,
    github: GitHubSnapshot | None,
    model: str,
    api_key: str | None,
) -> AIReport:
    evidence = EvidenceBundle(github=github)
    evidence_payload = evidence.model_dump(mode="json")
    evidence_digest = canonical_digest(evidence_payload)
    input_payload = {
        "project": project.model_dump(mode="json"),
        "githubSnapshot": github.model_dump(mode="json") if github else None,
        "promptVersion": PROMPT_VERSION,
    }
    input_digest = canonical_digest(input_payload)
    if not api_key:
        return fallback_report(
            project,
            evidence,
            "OPENAI_API_KEY is not set",
            model=model,
            input_digest=input_digest,
            evidence_digest=evidence_digest,
        )

    client = OpenAI(api_key=api_key)
    payload = {
        **input_payload,
        "requiredSchema": {
            "probability": "number 0.05-0.95, treated as AI Prior only",
            "aiPriorProbability": "same number as probability; frontend label is AI Prior",
            "aiPriorLabel": "AI Prior",
            "confidence": "low|medium|high",
            "bullish": ["short reason"],
            "bearish": ["short reason"],
            "riskFlags": ["short risk"],
            "settleable": "boolean",
            "dataSourcesUsed": ["github", "chain"],
            "suggestedQuestion": "binary market question",
        },
    }
    try:
        response = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, indent=2)},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
        parsed["probability"] = clamp_probability(float(parsed.get("probability", 0.5)))
        ai_prior = clamp_probability(float(parsed.get("aiPriorProbability", parsed["probability"])))
        return AIReport(
            projectSlug=project.slug,
            probability=parsed["probability"],
            aiPriorProbability=ai_prior,
            aiPriorLabel=parsed.get("aiPriorLabel") or "AI Prior",
            confidence=parsed.get("confidence", "low"),
            bullish=as_list(parsed.get("bullish")),
            bearish=as_list(parsed.get("bearish")),
            riskFlags=as_list(parsed.get("riskFlags")),
            settleable=bool(parsed.get("settleable", False)),
            dataSourcesUsed=as_list(parsed.get("dataSourcesUsed")) or inferred_sources(github),
            suggestedQuestion=parsed.get("suggestedQuestion") or default_question(project),
            provider="openai",
            model=model,
            promptVersion=PROMPT_VERSION,
            inputDigest=input_digest,
            evidenceDigest=evidence_digest,
            evidence=evidence,
        )
    except (Exception, ValidationError) as exc:
        return fallback_report(
            project,
            evidence,
            str(exc),
            model=model,
            input_digest=input_digest,
            evidence_digest=evidence_digest,
        )


def fallback_report(
    project: ProjectConfig,
    evidence: EvidenceBundle | None,
    error: str,
    *,
    model: str,
    input_digest: str,
    evidence_digest: str,
) -> AIReport:
    return AIReport(
        projectSlug=project.slug,
        probability=0.50,
        aiPriorProbability=0.50,
        aiPriorLabel="AI Prior",
        confidence="low",
        bullish=[],
        bearish=["AI analysis unavailable; defaulting to a neutral AI Prior."],
        riskFlags=["manual review required"],
        settleable=True,
        dataSourcesUsed=inferred_sources(evidence.github if evidence else None),
        suggestedQuestion=default_question(project),
        fallbackUsed=True,
        provider="openai",
        model=model,
        promptVersion=PROMPT_VERSION,
        inputDigest=input_digest,
        evidenceDigest=evidence_digest,
        error=error,
        evidence=evidence,
    )


def clamp_probability(value: float) -> float:
    return min(0.95, max(0.05, value))


def as_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    return [str(value)]


def inferred_sources(github: GitHubSnapshot | None) -> list[str]:
    sources: list[str] = []
    if github:
        sources.append("github")
    return sources


def default_question(project: ProjectConfig) -> str:
    return f"Will {project.name} satisfy this milestone by deadline: {project.milestone}?"
