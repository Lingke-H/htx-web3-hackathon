from __future__ import annotations

import json
from pathlib import Path

import pytest

from track_b.evidence import build_evidence_manifest, verify_evidence_manifest
from track_b.models import AIReport, GitHubSnapshot
from track_b.storage import write_analysis_artifacts


ADDRESS = "0x1111111111111111111111111111111111111111"


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def seed_bundle(root: Path, *, fallback: bool = False) -> None:
    root.mkdir()
    write_json(root / "project.json", {
        "slug": "veil-scout",
        "name": "Veil Scout",
        "description": "Builder discovery infrastructure",
        "github_repo": "Lingke-H/htx-web3-hackathon",
        "milestone": "Merge at least one PR in the evidence window",
        "deadline": 1893456000,
        "resolution_deadline": 1893456000,
        "verification_rule": {
            "type": "github_merged_prs",
            "target": 1,
            "lookbackDays": 30,
            "github_repo": "Lingke-H/htx-web3-hackathon",
        },
    })
    write_json(root / "github-snapshot.json", {
        "repo": "Lingke-H/htx-web3-hackathon",
        "merged_prs": 2,
        "window_start": "2029-12-02T00:00:00+00:00",
        "window_end": "2030-01-01T00:00:00+00:00",
        "data_unavailable": False,
    })
    write_json(root / "ai-report.json", {
        "projectSlug": "veil-scout",
        "probability": 0.72,
        "aiPriorProbability": 0.72,
        "aiPriorLabel": "AI Prior",
        "confidence": "medium",
        "bullish": ["Repository evidence is active."],
        "bearish": [],
        "riskFlags": [],
        "settleable": True,
        "dataSourcesUsed": ["github"],
        "suggestedQuestion": "Will Veil Scout merge one PR?",
        "fallbackUsed": fallback,
        "provider": "openai",
        "model": "gpt-4o-mini",
        "promptVersion": "veil-scout-ai-prior-v1",
        "inputDigest": "a" * 64,
        "evidenceDigest": "b" * 64,
    })
    rule = {
        "type": "github_merged_prs",
        "target": 1,
        "lookbackDays": 30,
        "github_repo": "Lingke-H/htx-web3-hackathon",
    }
    write_json(root / "verification.json", {
        "projectSlug": "veil-scout",
        "marketId": 0,
        "passed": True,
        "rule": rule,
        "observedMetrics": {"mergedPrs": 2, "target": 1},
        "dataSourceStatus": {"github": "available"},
        "settlementRationale": "PASS",
    })
    write_json(root / "release-assessment.json", {
        "projectSlug": "veil-scout",
        "marketId": 0,
        "vaultId": 0,
        "milestoneId": 0,
        "passed": True,
        "recommendedReleaseAmount": 4000,
        "rule": rule,
        "observedMetrics": {"mergedPrs": 2, "target": 1},
        "dataSourceStatus": {"github": "available"},
        "settlementRationale": "PASS",
        "trustBoundary": "Advisory only.",
    })
    write_json(root / "deployment.json", {
        "chainId": 84532,
        "network": "base-sepolia",
        "deployer": ADDRESS,
        "season": ADDRESS,
        "creditLedger": ADDRESS,
        "leaderboard": ADDRESS,
        "market": ADDRESS,
        "marketFactory": ADDRESS,
        "incubationVault": ADDRESS,
        "marketId": 0,
        "vaultId": 0,
        "transactions": {"deployment": "0x" + "c" * 64},
        "explorerBaseUrl": "https://sepolia.basescan.org",
    })


def test_build_and_verify_evidence_manifest(tmp_path: Path) -> None:
    bundle = tmp_path / "evidence"
    seed_bundle(bundle)
    manifest = build_evidence_manifest(bundle, code_commit="d" * 40)
    assert manifest["schemaVersion"] == 1
    assert manifest["chainId"] == 84532
    assert manifest["marketId"] == 0
    assert manifest["vaultId"] == 0
    assert manifest["model"] == "gpt-4o-mini"
    assert len(manifest["artifacts"]["ai-report.json"]) == 64
    assert verify_evidence_manifest(bundle)["codeCommit"] == "d" * 40


def test_evidence_manifest_rejects_fallback_report(tmp_path: Path) -> None:
    bundle = tmp_path / "evidence"
    seed_bundle(bundle, fallback=True)
    with pytest.raises(ValueError, match="fallback"):
        build_evidence_manifest(bundle, code_commit="d" * 40)


def test_evidence_manifest_detects_tampering(tmp_path: Path) -> None:
    bundle = tmp_path / "evidence"
    seed_bundle(bundle)
    build_evidence_manifest(bundle, code_commit="d" * 40)
    (bundle / "verification.json").write_text("{}\n", encoding="utf-8")
    with pytest.raises(ValueError, match="digest mismatch"):
        verify_evidence_manifest(bundle)


def test_write_analysis_artifacts_persists_report_and_snapshot(tmp_path: Path) -> None:
    report = AIReport.model_validate({
        "projectSlug": "veil-scout",
        "probability": 0.72,
        "confidence": "medium",
        "settleable": True,
        "suggestedQuestion": "Will Veil Scout merge one PR?",
        "provider": "openai",
        "model": "gpt-4o-mini",
        "promptVersion": "veil-scout-ai-prior-v1",
        "inputDigest": "a" * 64,
        "evidenceDigest": "b" * 64,
    })
    github = GitHubSnapshot(repo="Lingke-H/htx-web3-hackathon", merged_prs=2)
    report_path, snapshot_path = write_analysis_artifacts(tmp_path, report, github)
    assert report_path.name == "veil-scout-ai-report.json"
    assert snapshot_path.name == "veil-scout-github-snapshot.json"
    assert json.loads(snapshot_path.read_text())["repo"] == "Lingke-H/htx-web3-hackathon"
