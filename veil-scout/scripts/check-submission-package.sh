#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

failures=0

fail() {
  echo "ERROR: $*" >&2
  failures=$((failures + 1))
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "missing required file: $path"
}

require_text() {
  local path="$1"
  local text="$2"
  if [[ -f "$path" ]] && ! grep -Fq "$text" "$path"; then
    fail "$path is missing required text: $text"
  fi
}

required_files=(
  "LICENSE"
  "README.md"
  "docs/submission/final-submission.md"
  "docs/submission/demo-evidence.md"
  "docs/submission/ecosystem-resource-disclosure.md"
  "docs/submission/final-submission-checklist.md"
)

for path in "${required_files[@]}"; do
  require_file "$path"
done

canonical_pitch="Most hackathons stop at ranking. Veil Scout turns ranking into continuous builder discovery and milestone-based incubation."
require_text "README.md" "$canonical_pitch"
require_text "docs/submission/final-submission.md" "$canonical_pitch"
require_text "docs/submission/ecosystem-resource-disclosure.md" "No organizer resource integration claimed"
require_text "docs/submission/demo-evidence.md" "Not deployed"
require_text "docs/submission/final-submission-checklist.md" "Not supplied"

judge_files=(
  "README.md"
  "docs/submission/final-submission.md"
  "docs/submission/demo-evidence.md"
  "docs/submission/ecosystem-resource-disclosure.md"
  "docs/pitch/pitch-narrative.md"
  "veil-scout/frontend/lib/demo-data.ts"
  "veil-scout/frontend/components/app-shell.tsx"
)

for path in "${judge_files[@]}"; do
  [[ -f "$path" ]] || continue
  if grep -Eiq 'HTX (API|resource) integration (is |has been )?(live|implemented)|B\.AI[- ]powered|\$HTX (custody|payments?|rewards?) (is |are )?(live|implemented)' "$path"; then
    fail "$path contains an unqualified organizer-resource implementation claim"
  fi
done

if ! python3 - "$ROOT_DIR" <<'PY'
import re
import sys
from pathlib import Path
from urllib.parse import unquote

root = Path(sys.argv[1]).resolve()
sources = [root / "README.md", *sorted((root / "docs").rglob("*.md"))]
pattern = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")
errors: list[str] = []

for source in sources:
    if not source.is_file():
        continue
    for raw_target in pattern.findall(source.read_text(encoding="utf-8")):
        target = raw_target.strip().strip("<>")
        if not target or target.startswith(("#", "http://", "https://", "mailto:")):
            continue
        path_part = unquote(target.split("#", 1)[0])
        if not path_part:
            continue
        resolved = (root / path_part.lstrip("/")) if target.startswith("/") else (source.parent / path_part)
        if not resolved.resolve().exists():
            errors.append(f"{source.relative_to(root)} -> {target}")

if errors:
    print("Broken local Markdown links:", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    raise SystemExit(1)
PY
then
  failures=$((failures + 1))
fi

if ((failures > 0)); then
  echo "Submission package checks failed with $failures issue(s)." >&2
  exit 1
fi

echo "Submission package checks passed."
