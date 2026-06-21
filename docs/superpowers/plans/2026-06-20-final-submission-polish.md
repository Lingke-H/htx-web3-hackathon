# Veil Scout Final Submission Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Veil Scout immediately understandable, honestly scoped, reproducible, and submission-ready for HTX hackathon judges.

**Architecture:** Preserve the existing Solidity, Python oracle, and Next.js architecture. Add a small repository-level submission verifier, align all judge-facing copy around one builder-lifecycle story, and create canonical submission evidence documents that distinguish implemented, demo-grade, and roadmap behavior.

**Tech Stack:** Bash, Markdown, Next.js 16, React 19, TypeScript, GitHub Actions, Foundry, Python 3.11, pytest

## Global Constraints

- Canonical positioning: “Most hackathons stop at ranking. Veil Scout turns ranking into continuous builder discovery and milestone-based incubation.”
- Do not claim HTX APIs, B.AI compute, `$HTX` token use, public testnet deployment, token custody, or autonomous release unless independently verified.
- Sponsor units are demo accounting units, not assets or tokens.
- AI and oracle reports are advisory; trusted authorized roles settle markets and release milestones in P0.
- Existing P0.8 files remain supporting history; canonical final-submission files take precedence.
- Do not redesign the Solidity protocol or add late-stage dependencies.

---

### Task 1: Canonical submission-package verifier and CI gate

**Files:**
- Create: `veil-scout/scripts/check-submission-package.sh`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: repository-relative Markdown files and judge-facing frontend copy.
- Produces: `bash veil-scout/scripts/check-submission-package.sh`, returning exit `0` only when required assets and boundary phrases exist and local Markdown links resolve.

- [ ] **Step 1: Write the failing verifier**

Create a Bash script that checks the required canonical files (`LICENSE`, `README.md`, four `docs/submission/final-*` or evidence/disclosure files), asserts the canonical pitch and boundary terms with `grep -F`, scans judge-facing files for forbidden unqualified claims, and resolves local Markdown links through an embedded Python standard-library block.

- [ ] **Step 2: Run the verifier to confirm RED**

Run: `bash veil-scout/scripts/check-submission-package.sh`

Expected: non-zero exit naming missing `LICENSE` and canonical submission files.

- [ ] **Step 3: Add the verifier to CI**

Add a `submission` job to `.github/workflows/ci.yml`:

```yaml
  submission:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Verify submission package
        run: bash veil-scout/scripts/check-submission-package.sh
```

- [ ] **Step 4: Keep the verifier red until Tasks 2 and 3 are complete**

Run: `bash veil-scout/scripts/check-submission-package.sh`

Expected: non-zero exit because required judge-facing files/copy are not complete yet.

### Task 2: Judge-facing product story and trust-boundary UI

**Files:**
- Create: `veil-scout/frontend/scripts/verify-judge-copy.mjs`
- Modify: `veil-scout/frontend/package.json`
- Modify: `veil-scout/frontend/lib/demo-data.ts`
- Modify: `veil-scout/frontend/components/app-shell.tsx`
- Modify: `veil-scout/frontend/components/demo-preview.tsx`

**Interfaces:**
- Consumes: bilingual static content from `lib/demo-data.ts`.
- Produces: a first-viewport story focused on continuous builder discovery, explicit `Implemented / Demo-grade / Roadmap` status labels, a six-stage builder lifecycle, and honest live/fallback labels.

- [ ] **Step 1: Write the failing copy test**

Create a dependency-free Node script using `node:assert/strict` and `node:fs`. It must assert that the frontend source contains the English and Chinese canonical pitch, the three status classes, “trusted P0 oracle,” “sponsor units,” and all lifecycle stages; it must also reject unqualified “HTX Demo Net” and the generic `live` badge in `app-shell.tsx`.

- [ ] **Step 2: Register and run RED**

Add to `package.json`:

```json
"test:copy": "node scripts/verify-judge-copy.mjs"
```

Run: `cd veil-scout/frontend && npm run test:copy`

Expected: FAIL because the canonical first-viewport copy and status taxonomy are absent.

- [ ] **Step 3: Align bilingual content**

Update `demo-data.ts` so:

- the shell headline and hero lead with the canonical builder-lifecycle positioning;
- demo scope says market rows are seeded fallback data while local Anvil incubation can be live contract data;
- summary cards show `AI Prior`, `Crowd Odds`, `Trusted P0 oracle`, and `Sponsor units`;
- lifecycle steps are `Discover`, `Compare`, `Verify`, `Settle`, `Incubate`, `Release` (and equivalent Chinese copy);
- the incubation badge never says a mock execution is “verified” without the mock qualifier being prominent;
- roadmap text names optimistic oracle/challenge periods without implying implementation.

- [ ] **Step 4: Remove ambiguous network and health claims**

Update `app-shell.tsx` and `demo-preview.tsx` so default network text is `Local Anvil / wallet not connected`, “live” only appears when describing an actual wallet or configured contract read, and fallback/seeded values are labeled `Demo-grade`.

- [ ] **Step 5: Show the three-state legend in the first viewport**

Render compact badges for `Implemented`, `Demo-grade`, and `Roadmap`, each with one plain-language explanation sourced from localized data. Keep the existing visual system and responsive layout.

- [ ] **Step 6: Run GREEN and regression checks**

Run: `cd veil-scout/frontend && npm run test:copy && npm run lint && npm run build`

Expected: all commands exit `0`.

### Task 3: Canonical repository and submission materials

**Files:**
- Create: `LICENSE`
- Create: `docs/submission/final-submission.md`
- Create: `docs/submission/demo-evidence.md`
- Create: `docs/submission/ecosystem-resource-disclosure.md`
- Create: `docs/submission/final-submission-checklist.md`
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/submission/p08-submission-package.md`
- Modify: `docs/pitch/pitch-narrative.md`
- Modify: `docs/pitch/demo-diagrams.md`
- Modify: `docs/submission/p08-judge-qa.md`

**Interfaces:**
- Consumes: verified repository behavior, public Vercel URL, local demo commands, release tags, CI workflow, and the design’s explicit unknown values.
- Produces: one canonical submission narrative plus evidence, disclosure, and pre-submit checklist documents.

- [ ] **Step 1: Add the repository license**

Add the standard MIT License with copyright `2026 Veil Scout contributors`.

- [ ] **Step 2: Rewrite the README first viewport**

Lead with project name, canonical positioning, `AI x Web3`, public demo URL, explicit public-fallback/local-live status, one-command demo, and links to submission/evidence/architecture. Follow with the six-stage lifecycle, architecture, status matrix, HTX fit, limitations, setup, and verification.

- [ ] **Step 3: Write canonical final submission copy**

Create `final-submission.md` with concise sections for problem, solution, AI/Web3 split, mechanism, innovation, demo, commercial model, HTX fit, trust boundaries, roadmap, and team. Use `Not supplied` for team details.

- [ ] **Step 4: Write evidence and resource disclosure**

`demo-evidence.md` must record the public fallback URL, local live path, release baseline, test commands, expected demo state, missing video URL (`Not supplied`), and no public testnet addresses (`Not deployed`). `ecosystem-resource-disclosure.md` must state `No organizer resource integration claimed` and list HTX/B.AI/`$HTX` ideas only under roadmap.

- [ ] **Step 5: Write the final checklist**

Create checkboxes for links, tests, secrets, build, desktop/mobile UI, demo video, team details, resource disclosure, testnet addresses, pitch consistency, and prohibited overclaims. Mark unresolved team/video facts as blockers rather than inventing them.

- [ ] **Step 6: Align supporting pitch and Q&A**

Update the pitch to the problem → demo → boundaries → HTX value structure; extend the diagram from settlement through incubation release; add direct Q&A on prediction-market scope, sponsor-unit accounting, trusted roles, and current HTX integration status. Add canonical-document pointers to historical P0.8 materials.

- [ ] **Step 7: Run the package verifier to GREEN**

Run: `bash veil-scout/scripts/check-submission-package.sh`

Expected: `Submission package checks passed.` and exit `0`.

### Task 4: Full release verification and visual QA

**Files:**
- Modify if required by failures: files from Tasks 1–3 only.

**Interfaces:**
- Consumes: all implementation and documentation changes.
- Produces: fresh evidence for repository checks, contracts, oracle, frontend, E2E, and responsive judge UI.

- [ ] **Step 1: Run repository and artifact scans**

Run: `git diff --check && bash veil-scout/scripts/check-submission-package.sh`

Expected: both exit `0`.

- [ ] **Step 2: Run Foundry checks**

Run: `cd veil-scout/track-a-contracts && forge fmt --check && forge test`

Expected: formatting clean and all tests pass.

- [ ] **Step 3: Run Track B checks**

Run: `cd veil-scout/track-b-ai-oracle && .venv/bin/python -m py_compile src/track_b/*.py scripts/incubation_e2e.py && .venv/bin/python -m pytest`

Expected: compile exit `0` and all pytest tests pass.

- [ ] **Step 4: Run frontend checks**

Run: `cd veil-scout/frontend && npm run test:copy && npm run lint && npm run build`

Expected: all commands exit `0`.

- [ ] **Step 5: Run incubation E2E**

Run: `bash veil-scout/scripts/run-incubation-e2e.sh`

Expected: exit `0`, including the milestone assessment and release assertions.

- [ ] **Step 6: Start and inspect the live judge demo**

Run: `FRONTEND_PORT=3010 bash veil-scout/scripts/run-live-demo.sh`

Expected ready banner: chain `31337`, configured vault address, vault `0`, `ACTIVE`, `4,000` released, `8,000` remaining.

Inspect at desktop and mobile widths. Verify the canonical pitch, three-state legend, lifecycle, fallback/live labeling, bilingual content, no horizontal overflow, and incubation state.

- [ ] **Step 7: Review the diff against the design**

Run: `git status --short && git diff --stat && git diff -- README.md docs/submission veil-scout/frontend .github/workflows/ci.yml`

Expected: only scoped submission-polish changes, no secrets/generated deployment files, and every design requirement mapped to a changed artifact or explicit blocker.
