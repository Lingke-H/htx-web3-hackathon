# Final Submission Checklist

## Submission Blockers

- [ ] **BLOCKER — Not supplied:** add team member names and roles to `final-submission.md` and the submission form.
- [ ] **BLOCKER — Not supplied:** add the final public repository URL and verify it opens without authentication.
- [ ] **BLOCKER — Not deployed:** complete the Base Sepolia public proof runbook, publish non-zero addresses, explorer URLs, and `frontend/public/evidence/manifest.json`.
- [ ] **BLOCKER — Not verified:** rerun full CI/verification from the implementation commit and record the green commit/tag.
- [ ] **BLOCKER — Not deployed:** deploy the Vercel build with `NEXT_PUBLIC_DEMO_MODE=public` only after the manifest verifies.

Demo video is deferred until semi-finals / Top 40 and is not a preliminary blocker.

## Facts and Links

- [ ] public demo URL opens in a private browser session
- [ ] release URL and commit match the intended submission baseline
- [ ] repository is public and the MIT `LICENSE` is visible
- [ ] README links to final submission, evidence, disclosure, architecture, and Q&A
- [ ] every relative Markdown link passes `check-submission-package.sh`
- [ ] no private keys, tokens, `.env` values, deployment JSON, or local logs are tracked

## Verification

- [ ] `bash veil-scout/scripts/check-submission-package.sh`
- [ ] `forge fmt --check`
- [ ] `forge test`
- [ ] Track B `py_compile`
- [ ] Track B `pytest`
- [ ] `npm run test:copy`
- [ ] `npm run test:unit`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `python -m track_b.cli verify-evidence --evidence-dir ../frontend/public/evidence` after public evidence exists
- [ ] `bash veil-scout/scripts/run-incubation-e2e.sh`
- [ ] one-command demo prints the expected ready banner

## Visual QA

- [ ] desktop first viewport shows the canonical pitch and three-state legend
- [ ] mobile layout has no horizontal overflow
- [ ] English and Chinese modes tell the same product story
- [ ] AI Prior, Crowd Odds, verification evidence, settlement, reputation, and incubation are visible
- [ ] public proof, public fallback, and local contract-read states are visibly distinct
- [ ] Public Proof panel shows commit, model, prompt version, digests, explorer links, Crowd Odds, verification, leaderboard, milestones, and release state
- [ ] screenshots and demo video avoid wallet popups, debug consoles, and stale data labels

## Claim Safety

- [ ] credits are always described as non-transferable accounting units, not money
- [ ] sponsor units are never described as token custody or transfers
- [ ] AI reports and release assessments are described as advisory
- [ ] trusted P0 oracle/reviewer roles are disclosed
- [ ] no AMM, LP exposure, automatic investment, governance, or permissionless dispute system is claimed
- [ ] HTX APIs, B.AI, `$HTX`, and organizer resources are either evidenced or explicitly Roadmap
- [ ] optimistic oracle, challenge period, production custody, permissionless dispute, and formal ecosystem adapters are explicitly Roadmap or Not deployed

## Pitch Rehearsal

- [ ] opening: the problem is post-hackathon builder discovery and follow-through
- [ ] mechanism: AI Prior → Crowd Odds → Verify → Settle → Incubate → Release
- [ ] demo takes more time than architecture explanation
- [ ] HTX value is framed as a builder pipeline, not a fabricated integration
- [ ] final sentence returns to continuous builder discovery and milestone-based incubation
