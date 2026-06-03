---
name: run-checks
description: >-
  Run the project's quality gate — typecheck, lint, tests, and build — through
  the auto-detected package manager and test runner, then summarize failures
  concisely.
when_to_use: >-
  Use WHEN asked to run checks, verify the build, "make sure it passes", or
  before finishing a change / opening a PR. Auto-detects pnpm/npm/yarn and
  Vitest/Jest. Safe for Claude to run on its own before declaring work done.
argument-hint: "(no args)"
model: inherit
---

# Run the quality gate

Run each step through the shared detector — never hardcode a package manager or runner.

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
echo "Toolchain: PM=$PM, tests=$TEST_RUNNER, root=$PROJECT_ROOT"

run_typecheck   # tsc --noEmit or the project's typecheck script
run_lint        # eslint or the project's lint script
run_tests       # vitest run / jest / the project's test script
run_build       # the project's build script (skip if none defined)
```

Run the steps in that order. If a step fails, capture the output and continue running the
remaining independent steps so you can report everything at once (don't stop at the first
failure unless a later step depends on it).

## Report

Summarize concisely:
- ✅/❌ per step (typecheck, lint, tests, build).
- For failures: the file(s), the specific error, and the smallest fix. Group related
  failures; don't paste the whole log.
- If everything passes, say so in one line.

Offer to fix the failures, but don't make unrelated changes.

## Checklist
- [ ] Every step ran through `detect-toolchain.sh` (no hardcoded npm/vitest).
- [ ] Each step reported ✅/❌ with concise, actionable failure detail.
- [ ] Skipped steps (e.g. no build script) noted explicitly.
