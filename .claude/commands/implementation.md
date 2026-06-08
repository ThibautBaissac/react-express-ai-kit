---
name: implementation
description: Implement the unchecked items from the To-Do List in the task documentation.
argument-hint: "[task-number]"
arguments: [task]
---

> **Task selector:** `$task` is the task number passed to this command (e.g. `/implementation 2`). Everything below targets `tasks/task-$task.md`. If `/implementation` was invoked with no number, treat the task number as `1`.

Read the task documentation at `tasks/task-$task.md` and implement the unchecked items from the To-Do List.

The task doc is an expansion of one task from the overall specs at `tasks/specs.md`. The doc is your primary instruction set, and the specs are the upstream source of acceptance criteria and proof obligations. Implement against both: if the task doc and specs conflict, prefer the specs' declared Outcome / Scope / Acceptance criteria / Proof, keep the smallest change that satisfies this task, and update the task doc to reflect the correction.

Stay strictly inside this task's declared scope — do not implement work the specs assigned to other tasks. If a small enabling change is required to complete this task, keep it minimal and document why in the task doc.

## Instructions
1. Read the task documentation file in full.
2. Read the matching `### Task $task` block in `tasks/specs.md`, plus any global sections needed to understand architecture, imposed constraints, acceptance criteria, and proof obligations.
3. Check the current worktree status before editing. Do not revert, overwrite, or clean up unrelated user changes.
4. Read the files named by the plan, plus nearby code needed to follow existing patterns.
5. Check if a "Review Findings" section exists
   - If it does, pay special attention to documented issues
   - Address any issues from the previous review first
6. Find the To-Do List section and implement unchecked items following the plan.
7. Verify the implementation against the specs' Acceptance criteria and Proof, not only against the To-Do List.
8. Mark each item as completed ([x]) only after the code/docs/tests for that item are done and the relevant verification has passed or the failure is documented in the task doc.
9. Do NOT ask questions unless implementation is impossible without user input, external credentials, or a decision that would materially change scope. Make reasonable assumptions and proceed for everything else.

## Implementation Guardrails

- Preserve the architecture and ownership boundaries in the task doc, the specs, and project instructions.
- Prefer existing project patterns, helper APIs, and scripts over introducing new abstractions.
- Do not add future-task behavior, opportunistic refactors, deployment steps, PR/git workflow, or user-gated TODOs.
- If the plan missed a specs acceptance criterion that belongs to this task, implement it and update the task doc so review agents can see why.
- If a To-Do item is already satisfied by existing code, verify it, then mark it complete with any necessary note in the task doc.
- If a planned item is no longer valid because the codebase changed, make the smallest correct adjustment and document the reason in the task doc.

## Realize To-Do items with the project skills

These skills encode the project's conventions; prefer them over hand-rolling a
To-Do item from scratch, then adapt the output to the task. Reach for the one
that matches the work:

- `/scaffold-feature` — a new vertical slice or endpoint (`api`/`ui`/`full`).
- `/add-api-contract` — a new/changed FE↔BE request/response shape or DTO.
- `/add-mutation` — a create/update/delete write path with cache invalidation.
- `/scaffold-form` — a create/edit form bound to a request contract.
- `/react-router` — routes, layouts, route-level loading, URL/search state.
- `/style-component` — Tailwind + Headless UI presentational styling.
- `/scaffold-auth` — auth, server-side authorization, ownership checks.
- `/api-error-handling` — domain errors, status codes, frontend error mapping.
- `/scaffold-seed` — idempotent seed data for demos, security proofs, empty states.
- `/write-tests` — colocated unit/component/route tests for the Testing To-Dos.

The schema-migration subagent (not a skill) owns table definitions and
migrations. Skills are aids, not gates: if none fits, implement directly to the
task plan. They never widen scope — stay inside this task's declared boundary.

## Verification

Run checks in a risk-scaled order:
1. Targeted tests or commands for the files/behavior changed.
2. Manual/browser verification from the task plan when the feature has UI or HTTP behavior.
   - **Multi-step CLI checks** (e.g. `db:migrate` → `db:seed` → re-run for idempotency): record the terminal output (counts, success messages) as a one-line snippet next to the completed checklist item, so reviewers can verify it without re-running the sequence.
3. Broader project checks required by the task plan or project instructions, such as typecheck, lint, build, or full tests.

Use the project's documented helper commands when available. If a required check cannot be run, record the reason in the task doc and include it in your final response.

## Workflow Completion
After implementing, check if ALL To-Do items (both Implementation and Testing sections) are now marked as complete [x].

Before final response, summarize:
- Files changed.
- To-Do items completed.
- Tests/checks/manual verification run and their results.
- Any skipped verification, scope correction, or task doc update.

Start implementing now.

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
- **Browser checks run through Playwright** (`pnpm e2e`)

Browser / visual verification:
1. **Functional flows** (navigation, forms, auth, redirects, 404s): add or extend asserted specs in `e2e/*.spec.ts`, then run `pnpm e2e`. Playwright's `webServer` migrates + seeds an isolated `./e2e.db` and starts/stops the Express API and Vite web server automatically — do **not** start or stop dev servers by hand.
2. **Graded visual / responsive checks** (a UI that "breathes" at 375px and 1440px): `e2e/responsive.spec.ts` writes screenshots to `e2e/screenshots/`. Run `pnpm e2e`, then open/read those PNGs and judge the layout — Playwright captures, the aesthetic call is yours.
3. **Parallel task runs only** (avoid port/DB collisions; single-agent runs need nothing extra): `E2E_WEB_PORT=$((3100 + $task)) E2E_API_PORT=$((3200 + $task)) E2E_DATABASE_URL=./e2e-$task.db pnpm e2e`

### Test Execution Best Practices

When running the project's test suite:

1. **Run targeted tests first**: Only run test files related to your changes. This gives fast feedback.
2. **Full suite = background**: When running the complete test suite, ALWAYS use `run_in_background: true` on the Bash tool. Full suites can take 5-15 minutes and will exceed the default timeout.
3. **Wait for backgrounded tests before re-launching**: If a test command gets backgrounded (you receive a task ID), wait for it to complete using TaskOutput with `block: true`. Do NOT start another test run while one is still running — parallel suites compete for resources and take even longer. Only re-launch if the previous run completed and failed.
4. **Use fail-fast flags**: If the test framework supports it, use a fail-fast option to exit on first failure.
5. **Set generous timeouts**: If not using run_in_background, set `timeout: 600000` (10 minutes) for full test suites.
