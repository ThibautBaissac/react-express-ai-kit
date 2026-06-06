---
name: implementation
description: Implement the unchecked items from the To-Do List in the task documentation.
argument-hint: "[task-number]"
arguments: [task]
---

> **Task selector:** `$task` is the task number passed to this command (e.g. `/implementation 2`). Everything below targets `tasks/task-$task.md`. If `/implementation` was invoked with no number, treat the task number as `1`.

Read the task documentation at `tasks/task-$task.md` and implement the unchecked items from the To-Do List.

## Instructions
1. Read the task documentation file
2. Check if a "Review Findings" section exists
   - If it does, pay special attention to documented issues
   - Address any issues from the previous review first
3. Find the To-Do List section and implement unchecked items following the plan
4. Mark each item as completed ([x]) when done
5. Do NOT ask any questions - proceed directly with implementation

## Workflow Completion
After implementing, check if ALL To-Do items (both Implementation and Testing sections) are now marked as complete [x].

Start implementing now.

[System]
## Task Plan File

The canonical task plan — also known as the specification for this task — is stored at:
`tasks/task-$task.md`

**At the start of this conversation, before answering the user's first message, you MUST read this file in full using the Read tool.** It contains the requirements, constraints, and prior decisions you need to do this work correctly. Do not skip this step even if the user's first message looks unrelated to the plan.

When the user refers to the "task plan", "task doc", "task spec", "specifications", or asks you to read or update the task documentation, this is the file — read or edit it directly with the Read/Edit tool. Do NOT search for it elsewhere; the path above is authoritative.

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
