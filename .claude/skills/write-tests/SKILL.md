---
name: write-tests
description: >-
  Write colocated tests for React + Express + TypeScript code following the
  project's conventions — services tested against a mocked repository interface,
  components tested with React Testing Library and TanStack Query.
when_to_use: >-
  Use WHEN the user asks to write/add tests, improve coverage, or test a
  specific module, service, hook, or component. Auto-detects Vitest vs Jest.
  Do NOT use to run an existing suite (use /run-checks for that) or to debug a
  failing build unrelated to test authoring.
argument-hint: "[path-to-test]"
arguments: [target]
model: sonnet
---

# Write tests to convention

Target: `$target` (a file, dir, or feature). Tests live next to the code under test.

## Step 1 — Detect the runner and existing style

```bash
bash "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

Open a nearby existing test to copy the project's import style (`vitest` vs
`@jest/globals` vs globals), setup files, and mocking helpers (`vi.fn` vs `jest.fn`).
Read `references/test-patterns.md` for the canonical patterns.

## Step 2 — Pick the right kind of test per layer

- **Service** → unit test with a mocked repository interface (no DB, no HTTP).
- **Repository** → integration test only if the project has a test DB harness; otherwise
  skip and note it.
- **Hook / component using server data** → React Testing Library + a fresh QueryClient
  with `retry: false`; mock HTTP with MSW if the project uses it.
- **Presentational component** → render and assert on role/label/text.
- **Route** → optional supertest-style integration test if that pattern already exists.

## Step 3 — Write behavior-focused tests

Arrange–Act–Assert; assert observable outcomes, not private internals. Cover the happy
path plus the meaningful error/edge cases (not-found, validation failure, empty list).

## Step 4 — Run just the new tests

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_tests <new-test-path>
```

Iterate until green. Report coverage of behaviors, not a percentage.

## Checklist
- [ ] Runner + existing test style detected and matched.
- [ ] Test file colocated with the code under test.
- [ ] Services tested via a mocked repository interface.
- [ ] Query-backed UI uses a fresh client with `retry: false`; user-centric queries.
- [ ] Behavior asserted (incl. an error/edge case), not implementation details.
- [ ] New tests run green via the detected runner.
