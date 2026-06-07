---
name: ci-gate
description: Run the full local CI gate (typecheck, lint, test, build) and fix any failures until it passes green.
argument-hint: "[task-number]"
arguments: [task]
---

> **Task selector:** `$task` is the task number passed to this command (e.g. `/ci-gate 2`). Everything below targets `tasks/task-$task.md`. If `/ci-gate` was invoked with no number, treat the task number as `1`.

You are the final CI gate. This command runs **after** `/implementation`, `/review`, and `/refinement`. Your job is to run the project's full quality gate locally — the `ci` package script — and **act on the result**: drive it to green by fixing the failures it reports, then record the outcome.

The `ci` script chains the same checks an automated pipeline would run, in fail-fast order:

```bash
pnpm run ci   # = pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Because the steps are chained with `&&`, the script stops at the **first** failing stage. Fix that stage, then re-run the whole script — a later stage may surface new failures only once the earlier one passes.

## Process

### 1. Run the gate
Run `pnpm run ci`. The script includes the full test suite and a production build, so it can take several minutes:
- Run it with `run_in_background: true` on the Bash tool and wait for completion with TaskOutput (`block: true`).
- Do NOT start a second run while one is in flight — parallel runs compete for resources.

### 2. If it passes green
- Record the result in the task doc (see Step 4) with **Status: PASS** and the final command output snippet.
- Run the completion command to signal the workflow is done:
  ```bash
  tsx scripts/complete-workflow.ts $task
  ```
- Stop here.

### 3. If it fails — diagnose and fix
Identify which stage failed from the output (typecheck / lint / test / build), then:

1. **Read the failing output carefully** — the error, file, and line.
2. **Make the smallest correct fix** that addresses the root cause. Stay inside this task's scope (`tasks/task-$task.md` and the matching `### Task $task` block in `tasks/specs.md`). Do not opportunistically refactor or fix unrelated pre-existing failures — if a failure is clearly outside this task's changes, document it rather than reworking unrelated code.
3. **Respect project conventions** — let the lint/format tooling own style; do not hand-format. Preserve the architecture and ownership boundaries in `CLAUDE.md` and `.claude/rules/architecture.md`.
4. **Re-run `pnpm run ci`** (background again) and repeat from Step 1.

Iterate until the gate is green or you hit the stop condition below.

#### Stop condition — BLOCKED
If after **3 full fix-and-rerun cycles** the gate is still red, or a failure requires user input / external access you cannot provide, stop and mark the task **BLOCKED**. Do NOT run the completion command. Document exactly which stage fails, the error, and what is needed to unblock.

### 4. Update task documentation
REPLACE the entire "Review Findings" section of `tasks/task-$task.md` (never append) with the current CI result:

```markdown
## Review Findings

**Status:** PASS | BLOCKED

### CI Gate (`pnpm run ci`)
- typecheck: PASS / FAIL
- lint:      PASS / FAIL
- test:      PASS / FAIL
- build:     PASS / FAIL

### Fixes Applied
- [file:line — what was fixed and why]

### Blocking Issues
- [only if BLOCKED: stage, error, what's needed to unblock]
```

## Important Constraints
- Only fix what the gate reports failing; keep changes minimal and in-scope.
- Do NOT weaken the gate to make it pass — no skipping tests, disabling lint rules, or loosening types to silence errors. If a check is genuinely wrong, document it as a finding instead.
- Do NOT run the completion command unless the gate is fully green.
- ALWAYS REPLACE (never append to) the Review Findings section.

Start by running the gate now.

[System]
## Task Plan File

The canonical task plan — also known as the specification for this task — is stored at:
`tasks/task-$task.md`

**At the start of this conversation, before answering the user's first message, you MUST read this file in full using the Read tool.** It contains the requirements, constraints, and prior decisions you need to do this work correctly. Do not skip this step even if the user's first message looks unrelated to the plan.

When the user refers to the "task plan", "task doc", "task spec", "specifications", or asks you to read or update the task documentation, this is the file — read or edit it directly with the Read/Edit tool. Do NOT search for it elsewhere; the path above is authoritative.

## Source Specs

The task plan above is one task expanded from the **overall specs** at `tasks/specs.md`. Those specs are the upstream source of context: their `### Task $task — …` block (found via the `**Becomes:** tasks/task-$task.md` marker) defines this task's outcome, scope, acceptance criteria, and proof, and their global sections define the constraints, architecture decisions, and grading criteria all tasks share. When you need the *why* behind a requirement, or context the task doc omits, read the matching task block and the global sections of `tasks/specs.md`.

---

## Testing Configuration

- **Task ID:** $task
- **Dev Server Port:** compute as `3100 + $task` (e.g. task `1` → `3101`, task `2` → `3102`)

When running Claude-in-Chrome MCP tests, start the dev server on your assigned port (`3100 + $task`):
1. Start the web (Vite) dev server on your assigned port — the browser hits this: `pnpm dev:web -- --port <port>`
2. Start the Express API in parallel (default port 3000, which Vite proxies `/api` to): `pnpm dev:api`
3. Drive the browser (via Claude-in-Chrome MCP) against `http://localhost:<port>`
4. Stop the web server when testing is complete: `lsof -ti:<port> | xargs kill -9 2>/dev/null || true` (also stop the API on :3000 if you started it)

### Test Execution Best Practices

When running the project's test suite:

1. **Run targeted tests first**: Only run test files related to your changes. This gives fast feedback.
2. **Full suite = background**: When running the complete test suite, ALWAYS use `run_in_background: true` on the Bash tool. Full suites can take 5-15 minutes and will exceed the default timeout.
3. **Wait for backgrounded tests before re-launching**: If a test command gets backgrounded (you receive a task ID), wait for it to complete using TaskOutput with `block: true`. Do NOT start another test run while one is still running — parallel suites compete for resources and take even longer. Only re-launch if the previous run completed and failed.
4. **Use fail-fast flags**: If the test framework supports it, use a fail-fast option to exit on first failure.
5. **Set generous timeouts**: If not using run_in_background, set `timeout: 600000` (10 minutes) for full test suites.
