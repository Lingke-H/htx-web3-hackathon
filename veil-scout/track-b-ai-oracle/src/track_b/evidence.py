from __future__ import annotations

import json
import re
from hashlib import sha256
from pathlib import Path
from typing import Any

from .models import AIReport, GitHubSnapshot, ProjectConfig, VerificationReport


SCHEMA_VERSION = 1
BASE_SEPOLIA_CHAIN_ID = 84_532
REQUIRED_ARTIFACTS = (
    "project.json",
    "github-snapshot.json",
    "ai-report.json",
    "verification.json",
    "release-assessment.json",
    "deployment.json",
)
CONTRACT_KEYS = (
    "season",
    "creditLedger",
    "leaderboard",
    "market",
    "marketFactory",
    "incubationVault",
)
HEX_40 = re.compile(r"^[0-9a-f]{40}$")
ADDRESS = re.compile(r"^0x[0-9a-fA-F]{40}$")
ZERO_ADDRESS = "0x" + "0" * 40


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def _file_digest(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def _require_bundle_files(evidence_dir: Path) -> None:
    missing = [name for name in REQUIRED_ARTIFACTS if not (evidence_dir / name).is_file()]
    if missing:
        raise ValueError(f"missing evidence artifacts: {', '.join(missing)}")


def _validate_address(value: object, label: str) -> str:
    if not isinstance(value, str) or not ADDRESS.fullmatch(value) or value.lower() == ZERO_ADDRESS:
        raise ValueError(f"{label} must be a non-zero EVM address")
    return value


def _validate_bundle(evidence_dir: Path, code_commit: str) -> dict[str, Any]:
    _require_bundle_files(evidence_dir)
    if not HEX_40.fullmatch(code_commit):
        raise ValueError("codeCommit must be a 40-character lowercase git SHA")

    ProjectConfig.model_validate(_read_json(evidence_dir / "project.json"))
    github = GitHubSnapshot.model_validate(_read_json(evidence_dir / "github-snapshot.json"))
    ai_report = AIReport.model_validate(_read_json(evidence_dir / "ai-report.json"))
    verification = VerificationReport.model_validate(_read_json(evidence_dir / "verification.json"))
    release = VerificationReport.model_validate(_read_json(evidence_dir / "release-assessment.json"))
    deployment = _read_json(evidence_dir / "deployment.json")

    if github.data_unavailable:
        raise ValueError("GitHub evidence is unavailable")
    if ai_report.fallbackUsed:
        raise ValueError("fallback AI report cannot enter the public evidence bundle")
    if not verification.passed or not release.passed:
        raise ValueError("verification and release assessment must both pass")
    if deployment.get("chainId") != BASE_SEPOLIA_CHAIN_ID:
        raise ValueError("deployment chainId must be Base Sepolia 84532")

    contracts = {
        key: _validate_address(deployment.get(key), f"deployment.{key}")
        for key in CONTRACT_KEYS
    }
    market_id = deployment.get("marketId")
    vault_id = deployment.get("vaultId")
    if not isinstance(market_id, int) or market_id < 0:
        raise ValueError("deployment.marketId must be a non-negative integer")
    if not isinstance(vault_id, int) or vault_id < 0:
        raise ValueError("deployment.vaultId must be a non-negative integer")

    return {
        "aiReport": ai_report,
        "contracts": contracts,
        "deployment": deployment,
        "marketId": market_id,
        "vaultId": vault_id,
    }


def build_evidence_manifest(evidence_dir: Path, code_commit: str) -> dict[str, Any]:
    validated = _validate_bundle(evidence_dir, code_commit)
    ai_report: AIReport = validated["aiReport"]
    deployment = validated["deployment"]
    explorer_base = deployment.get("explorerBaseUrl", "https://sepolia.basescan.org").rstrip("/")
    transactions = deployment.get("transactions", {})

    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "codeCommit": code_commit,
        "chainId": BASE_SEPOLIA_CHAIN_ID,
        "network": "base-sepolia",
        "contracts": validated["contracts"],
        "marketId": validated["marketId"],
        "vaultId": validated["vaultId"],
        "provider": ai_report.provider,
        "model": ai_report.model,
        "promptVersion": ai_report.promptVersion,
        "inputDigest": ai_report.inputDigest,
        "evidenceDigest": ai_report.evidenceDigest,
        "artifacts": {
            name: _file_digest(evidence_dir / name)
            for name in REQUIRED_ARTIFACTS
        },
        "explorer": {
            "baseUrl": explorer_base,
            "contracts": {
                key: f"{explorer_base}/address/{address}"
                for key, address in validated["contracts"].items()
            },
            "transactions": {
                key: f"{explorer_base}/tx/{tx_hash}"
                for key, tx_hash in transactions.items()
                if isinstance(tx_hash, str) and tx_hash.startswith("0x")
            },
        },
    }
    _write_json(evidence_dir / "manifest.json", manifest)
    return manifest


def verify_evidence_manifest(evidence_dir: Path) -> dict[str, Any]:
    manifest_path = evidence_dir / "manifest.json"
    if not manifest_path.is_file():
        raise ValueError("manifest.json is missing")
    manifest = _read_json(manifest_path)
    artifacts = manifest.get("artifacts")
    if not isinstance(artifacts, dict):
        raise ValueError("manifest artifacts map is missing")
    for name in REQUIRED_ARTIFACTS:
        expected = artifacts.get(name)
        actual = _file_digest(evidence_dir / name)
        if expected != actual:
            raise ValueError(f"digest mismatch for {name}")
    _validate_bundle(evidence_dir, str(manifest.get("codeCommit", "")))
    return manifest
