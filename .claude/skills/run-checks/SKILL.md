---
name: run-checks
description: "Run the project quality gate through the auto-detected package manager and test runner, then summarize failures concisely."
when_to_use: "Use WHEN asked to run checks, verify the build, make sure it passes, or verify work before a PR. Safe for Claude to run before declaring work done."
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
