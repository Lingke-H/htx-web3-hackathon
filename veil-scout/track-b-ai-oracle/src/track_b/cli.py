from __future__ import annotations

from pathlib import Path

import typer
from rich.console import Console

from .analyst import analyze_project
from .chain_client import ChainClient
from .config import load_settings
from .evidence import build_evidence_manifest, verify_evidence_manifest
from .github_client import GitHubClient
from .models import CreatedMarket, release_assessment_path, verification_path
from .storage import load_project, load_report, load_verification, write_analysis_artifacts, write_json
from .verifier import assess_milestone_release, verify_project

app = typer.Typer(help="Veil Scout Track B AI analyst and settlement oracle CLI.")
console = Console()


@app.command()
def analyze(project: Path = typer.Option(..., exists=True, readable=True)) -> Path:
    settings = load_settings()
    config = load_project(project)
    github = GitHubClient(settings.github_token).snapshot(config.github_repo) if config.github_repo else None
    report = analyze_project(config, github, settings.openai_model, settings.openai_api_key)
    if github is None:
        raise typer.BadParameter("public AI evidence requires a configured GitHub repository")
    output, snapshot_output = write_analysis_artifacts(settings.data_dir, report, github)
    console.print(f"[green]AI report written:[/green] {output}")
    console.print(f"[green]GitHub snapshot written:[/green] {snapshot_output}")
    ai_prior = report.aiPriorProbability if report.aiPriorProbability is not None else report.probability
    console.print(f"aiPrior={ai_prior:.2f} confidence={report.confidence} fallback={report.fallbackUsed}")
    return output


@app.command("build-evidence")
def build_evidence(
    evidence_dir: Path = typer.Option(..., exists=True, file_okay=False, readable=True, writable=True),
    code_commit: str = typer.Option(...),
) -> Path:
    manifest = build_evidence_manifest(evidence_dir, code_commit)
    output = evidence_dir / "manifest.json"
    console.print(
        f"[green]Evidence manifest written:[/green] {output} "
        f"artifacts={len(manifest['artifacts'])}"
    )
    return output


@app.command("verify-evidence")
def verify_evidence(
    evidence_dir: Path = typer.Option(..., exists=True, file_okay=False, readable=True),
) -> Path:
    manifest = verify_evidence_manifest(evidence_dir)
    console.print(
        f"[green]Evidence manifest verified:[/green] "
        f"commit={manifest['codeCommit']} chain={manifest['chainId']}"
    )
    return evidence_dir / "manifest.json"


@app.command("create-market")
def create_market(
    project: Path = typer.Option(..., exists=True, readable=True),
    report: Path = typer.Option(..., exists=True, readable=True),
    metadata_uri: str | None = typer.Option(None),
) -> Path:
    settings = load_settings()
    config = load_project(project)
    ai_report = load_report(report)
    uri = metadata_uri or f"local://track-b-ai-oracle/reports/{ai_report.projectSlug}-ai-report.json"
    chain = _chain(settings)
    created = chain.create_market(config, uri)
    output = settings.data_dir / "settlements" / f"{config.slug}-created-market-{created.marketId}.json"
    write_json(output, created)
    console.print(f"[green]Market created:[/green] marketId={created.marketId} tx={created.tx.txHash}")
    return output


@app.command()
def verify(
    project: Path = typer.Option(..., exists=True, readable=True),
    market_id: int = typer.Option(..., min=0),
    milestone_id: str | None = typer.Option(None),
    recommended_release_amount: int | None = typer.Option(None, min=0),
) -> Path:
    settings = load_settings()
    config = load_project(project)
    chain = _chain(settings, require_private_key=False) if config.verification_rule.type == "contract_event_count" else None
    report = verify_project(
        config,
        market_id,
        GitHubClient(settings.github_token),
        chain,
        milestone_id=milestone_id,
        recommended_release_amount=recommended_release_amount,
    )
    output = verification_path(settings.data_dir, config.slug, market_id)
    write_json(output, report)
    console.print(f"[green]Verification written:[/green] {output}")
    console.print(
        "passed="
        f"{report.passed} observed={report.observedMetrics} milestoneId={report.milestoneId} "
        f"release={report.recommendedReleaseAmount} pause={report.pauseRecommendation}"
    )
    return output


@app.command("assess-release")
def assess_release(
    project: Path = typer.Option(..., exists=True, readable=True),
    market_id: int = typer.Option(..., min=0),
    vault_id: int = typer.Option(..., min=0),
    milestone_id: int = typer.Option(..., min=0),
    recommended_release_amount: int | None = typer.Option(None, min=0),
) -> Path:
    settings = load_settings()
    config = load_project(project)
    chain = _chain(settings, require_private_key=False)
    try:
        report = assess_milestone_release(
            config,
            market_id,
            vault_id,
            milestone_id,
            chain_client=chain,
            github_client=GitHubClient(settings.github_token),
            recommended_release_amount=recommended_release_amount,
        )
    except ValueError as exc:
        raise typer.BadParameter(str(exc)) from exc

    output = release_assessment_path(settings.data_dir, config.slug, market_id, vault_id, milestone_id)
    write_json(output, report)
    console.print(f"[green]Release assessment written:[/green] {output}")
    console.print(
        "passed="
        f"{report.passed} vaultId={report.vaultId} milestoneId={report.milestoneId} "
        f"release={report.recommendedReleaseAmount} pause={report.pauseRecommendation}"
    )
    console.print(report.trustBoundary)
    console.print(report.releaseCommandPreview)
    return output


@app.command()
def settle(
    market_id: int = typer.Option(..., min=0),
    verification: Path = typer.Option(..., exists=True, readable=True),
) -> Path:
    settings = load_settings()
    report = load_verification(verification)
    if report.marketId != market_id:
        raise typer.BadParameter(f"verification marketId {report.marketId} does not match {market_id}")
    tx = _chain(settings).settle(market_id, report.passed)
    output = settings.data_dir / "settlements" / f"{report.projectSlug}-settled-market-{market_id}.json"
    write_json(output, {"projectSlug": report.projectSlug, "marketId": market_id, "passed": report.passed, "tx": tx.model_dump(mode="json")})
    console.print(f"[green]Market settled:[/green] marketId={market_id} passed={report.passed} tx={tx.txHash}")
    return output


@app.command()
def advance_time(seconds: int = typer.Option(..., min=1)) -> None:
    settings = load_settings()
    _chain(settings, require_private_key=False).advance_time(seconds)
    console.print(f"[green]Advanced local chain time:[/green] {seconds} seconds")


@app.command()
def demo(project: Path = typer.Option(..., exists=True, readable=True)) -> None:
    settings = load_settings()
    report_file = analyze(project)
    created_file = create_market(project, report_file)
    created = CreatedMarket.model_validate_json(created_file.read_text(encoding="utf-8"))
    chain = _chain(settings, require_private_key=False)
    if not chain.can_settle(created.marketId):
        delta = chain.market_resolution_deadline(created.marketId) - chain.current_block_timestamp() + 1
        if delta > 0:
            chain.advance_time(delta)
            console.print(f"[yellow]Advanced local chain to resolution deadline:[/yellow] +{delta}s")
    verification_file = verify(project, created.marketId)
    settle(created.marketId, verification_file)


def _chain(settings, require_private_key: bool = True) -> ChainClient:
    private_key = settings.private_key if require_private_key else settings.private_key
    return ChainClient(
        settings.rpc_url,
        settings.contracts_dir,
        settings.deployment_json,
        private_key=private_key,
        chain_id=settings.chain_id,
    )


if __name__ == "__main__":
    app()
