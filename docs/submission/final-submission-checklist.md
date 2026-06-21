# Final Submission Checklist

## Submission Blockers

- [ ] **BLOCKER — Not supplied:** add team member names and roles to `final-submission.md` and the submission form.
- [ ] **BLOCKER — Not supplied:** record and add the final public demo-video URL to `demo-evidence.md`.

Public testnet addresses are **Not deployed** and are not a blocker while the submission describes the reproducible local Anvil path accurately.

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
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `bash veil-scout/scripts/run-incubation-e2e.sh`
- [ ] one-command demo prints the expected ready banner

## Visual QA

- [ ] desktop first viewport shows the canonical pitch and three-state legend
- [ ] mobile layout has no horizontal overflow
- [ ] English and Chinese modes tell the same product story
- [ ] AI Prior, Crowd Odds, verification evidence, settlement, reputation, and incubation are visible
- [ ] public fallback and local contract-read states are visibly distinct
- [ ] screenshots and demo video avoid wallet popups, debug consoles, and stale data labels

## Claim Safety

- [ ] credits are always described as non-transferable accounting units, not money
- [ ] sponsor units are never described as token custody or transfers
- [ ] AI reports and release assessments are described as advisory
- [ ] trusted P0 oracle/reviewer roles are disclosed
- [ ] no AMM, LP exposure, automatic investment, governance, or permissionless dispute system is claimed
- [ ] HTX APIs, B.AI, `$HTX`, and organizer resources are either evidenced or explicitly Roadmap
- [ ] optimistic oracle, challenge period, production custody, and testnet deployment are explicitly Roadmap or Not deployed

## Pitch Rehearsal

- [ ] opening: the problem is post-hackathon builder discovery and follow-through
- [ ] mechanism: AI Prior → Crowd Odds → Verify → Settle → Incubate → Release
- [ ] demo takes more time than architecture explanation
- [ ] HTX value is framed as a builder pipeline, not a fabricated integration
- [ ] final sentence returns to continuous builder discovery and milestone-based incubation
