---
name: refinement
description: Refine the codebase by performing code simplification and a security review in parallel, then applying any necessary security fixes.
argument-hint: "[task-number]"
arguments: [task]
---

> **Task selector:** `$task` is the task number passed to this command (e.g. `/refinement 2`). Everything below targets `tasks/task-$task.md`. If `/refinement` was invoked with no number, treat the task number as `1`.

You are a refinement agent. Your job is to improve the code through two parallel sub-tasks, then apply security fixes.

## Context
- Task Documentation: `tasks/task-$task.md`
- Overall specs (source of context): `tasks/specs.md` — the `### Task $task` block plus the global Architecture & key decisions / Imposed constraints sections define the conventions this task's code must follow. Simplifications must not violate them (e.g. don't collapse a deliberate slice boundary or ownership decision the specs made).
- Task ID: $task

## Step 1: Spawn Both Sub-tasks in Parallel

Use the Task tool to spawn BOTH sub-tasks simultaneously in a single response. Do NOT wait for one to finish before spawning the other.

### Sub-task A: Code Simplification

```
You are a code simplification agent. Your job is to review recently modified code and simplify it for clarity, consistency, and maintainability.

## Process
1. Run `git diff main --name-only` to identify modified files
2. Read each modified file
3. Look for opportunities to simplify:
   - Remove unnecessary complexity
   - Improve naming for clarity
   - Reduce duplication
   - Simplify conditional logic
   - Improve code organization
4. Apply fixes directly to the code
5. Ensure all functionality is preserved — do NOT change behavior
6. Follow project standards from CLAUDE.md and the architecture/ownership decisions recorded in the specs at `tasks/specs.md` (their `## Architecture & key decisions` and `### Task $task` block) — do not simplify in a way that breaks a deliberate boundary the specs established

## Constraints
- Only modify files that were changed in this branch
- Do NOT modify test files unless they have obvious issues
- Do NOT modify task documentation
- Preserve all existing functionality
- Keep changes minimal and focused
```

### Sub-task B: Security Review

```
You are a security review agent. Analyze the code changes for security vulnerabilities.

## Process
1. Run `git diff main` to see all changes
2. Run `git status` to see current state
3. Run `git log main..HEAD --oneline` to see commit history

## Three-Phase Analysis

### Phase 1: Context Research
- Understand what the code does and its security context
- Identify trust boundaries, data flows, and attack surfaces

### Phase 2: Comparative Analysis
- Compare changes against security best practices
- Check for common vulnerability patterns (OWASP Top 10)

### Phase 3: Vulnerability Assessment
For each potential finding, assess:
- Severity: HIGH / MEDIUM / LOW
- Confidence: 1-10 scale (only report findings with confidence >= 8)
- Exploitability: How could this be exploited?
- Recommended fix: Specific code change needed

## Output Format
Return a markdown report with:
- Summary of changes reviewed
- List of findings (HIGH/MEDIUM only, confidence >= 8)
- For each finding: file, line, description, severity, confidence, recommended fix
- If no high-confidence vulnerabilities found, state that explicitly

## Constraints
- Focus on HIGH-CONFIDENCE vulnerabilities only (confidence >= 8)
- Do NOT modify any files — this is a read-only review
- Do NOT report low-severity or speculative issues
- Be specific about file paths and line numbers
```

Wait for BOTH sub-tasks to complete before proceeding to Step 2.

## Step 2: Apply Security Fixes

Read the security review report from Sub-task B. For each HIGH or MEDIUM finding with confidence >= 8:
1. Read the affected file
2. Apply the recommended fix
3. Verify the fix doesn't break functionality

If no findings were reported, skip this step.

## Step 3: Summary
Log a brief summary of all changes made:
- Number of simplifications applied
- Number of security fixes applied
- Files modified

## Important Constraints
- Do NOT modify task documentation at `tasks/task-$task.md`
- Do NOT run completion scripts
- Do NOT ask questions — proceed autonomously
- Do NOT run tests — the CI-gate agent will handle CI

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
