---
name: write-tests
description: "Write colocated tests for React + Express + TypeScript code using the project's runner, conventions, mocked repository interfaces, React Testing Library, and TanStack Query patterns."
when_to_use: "Use WHEN adding tests, improving coverage, or testing a module, service, hook, component, route, or feature — whether the user asks directly or an implementation agent is realizing a Testing To-Do item from a `tasks/task-N.md` plan. Do NOT use to run an existing suite; use /run-checks for that."
argument-hint: "[path-to-test]"
arguments: [target]
model: sonnet
---

# Write tests to convention

Test `$target`. Colocate tests.

## Step 1 — Detect runner and style

```bash
bash "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

Open nearby tests first. Match imports, setup, mocks, naming, and
`references/test-patterns.md`.

## Step 2 — Pick the test type

- Service tests use a mocked repository interface and no DB or HTTP.
- Repository tests are integration tests only when the project already has a test DB harness.
- Query-backed hooks and components use React Testing Library with a fresh QueryClient and `retry: false`.
- Presentational components render with props and assert by role, label, or text.
- Route tests use the project's existing supertest-style pattern when one exists.

## Step 3 — Write behavior tests

Use Arrange-Act-Assert. Test observable outcomes, including meaningful error or
edge cases, not private internals.

## Step 4 — Run new tests

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_tests <new-test-path>
```

Iterate until tests pass. Report covered behaviors, not a coverage percentage.

## Checklist

- [ ] Runner and local test style were detected.
- [ ] Test file is colocated with the code under test.
- [ ] Services use a mocked repository interface.
- [ ] Query-backed UI uses a fresh QueryClient with `retry: false`.
- [ ] Assertions target user-visible behavior or boundary calls.
- [ ] New tests pass through the detected runner.
