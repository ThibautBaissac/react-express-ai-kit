---
name: run-checks
description: "Run the project quality gate through the auto-detected package manager and test runner, then summarize failures concisely."
when_to_use: "Use WHEN asked to run checks, verify the build, make sure it passes, or verify work before a PR — including the verification step of `/implementation` after realizing To-Do items. Safe for Claude to run before declaring work done. This is the lightweight author-time gate; the final pipeline gate is `/ci-gate`, which also fixes failures and records the result."
argument-hint: "(no args)"
model: inherit
---

# Run the quality gate

Run every step through the detector. Never hardcode the package manager or runner.

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
echo "Toolchain: PM=$PM, tests=$TEST_RUNNER, root=$PROJECT_ROOT"

run_typecheck
run_lint
run_tests
run_build
```

Order: typecheck, lint, tests, build. After a failure, capture the signal and
continue independent steps. Mark missing scripts or binaries as skipped.

> **Relationship to `/ci-gate`.** This skill runs the four steps *individually*
> and keeps going after a failure to surface every signal at once — ideal for
> author-time feedback inside `/implementation`. `/ci-gate` runs the chained
> `ci` script (`typecheck && lint && test && build`) **fail-fast**, then fixes
> failures and writes the result to the task doc. A green `run-checks` does not
> guarantee `/ci-gate` passes (ordering differs), so the pipeline still ends on
> `/ci-gate`. Use this skill to catch problems early, not to replace that gate.

## Report

- ✅/❌ per step: typecheck, lint, tests, build.
- For failures, report the file, the exact error, and the smallest useful fix.
- Group related failures, and do not paste full logs.
- If everything passes, say so in one line.

Fix requested failures without unrelated changes.

## Checklist

- [ ] Every command ran through `detect-toolchain.sh`.
- [ ] Each step has a concise pass/fail result.
- [ ] Skipped steps are named with the reason.
