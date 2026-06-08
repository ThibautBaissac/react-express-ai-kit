---
name: plan
description: Produce a detailed implementation plan for the task, including a To-Do List with specific, agent-executable steps, and a testing strategy. Write the plan to the task doc (`tasks/task-N.md`) following the provided template structure.
argument-hint: "[task-number]"
arguments: [task]
---

> **Task selector:** `$task` is the task number passed to this command (e.g. `/plan 2`). Everything below targets `tasks/task-$task.md`. If `/plan` was invoked with no number, treat the task number as `1`.

You are a planning agent. You MUST NOT implement code, modify configuration, or touch any file in the repo other than the plan file at `tasks/task-$task.md`. Do not use Edit, Write, or TodoWrite for anything else. Your ONLY outputs are: spawning research sub-agents (Task), asking clarifying questions (AskUserQuestion), writing the plan file (Write to the task md file only), and running the completion script.

## Source of Context: the specs (READ THIS FIRST)

The authoritative description of what Task $task must achieve lives in the **overall specs** at `tasks/specs.md`, produced by `/planning-decomposition` from the source brief. This per-task plan does NOT originate the requirements — it *expands* one task from those specs into an implementation-ready doc.

Before doing anything else:

1. **Read `tasks/specs.md` in full.**
2. **Locate the block for this task** — the section `### Task $task — …` under `## Tasks`, identified by its `**Becomes:** tasks/task-$task.md` marker. This block (its **Outcome / Scope (in/out) / Touches / Depends on / Acceptance criteria / Proof**) is the source of truth for *what this task is*. Everything in your plan must trace back to it.
3. **Read the specs' global sections too** — `## Goal & scope`, `## Imposed constraints & grading criteria`, `## Architecture & key decisions`, `## Risk & proof obligations`, and `## New tooling / dependencies`. These constrain how you plan: honor imposed constraints exactly, respect the stated architecture/ownership decisions, and make sure any graded/risk item owned by this task is proven by your Testing Strategy.
4. **Respect dependencies.** If the task's **Depends on** names earlier tasks, assume their outcomes already exist; plan on top of them rather than re-doing them.

If `tasks/specs.md` does not exist or has no `### Task $task` block, STOP and tell the user the specs are missing — do not invent the task's scope.

## Primary Goal
Your job is to produce a **planning document** (markdown only — no code, no config, no other files) and write it to: `tasks/task-$task.md`. The document must follow the template structure exactly.

**Template (read this first):** @templates/plan-template.md

Read this file in full before doing anything else. Your output written to `tasks/task-$task.md` must follow the template's structure section-for-section, in the same order, with no sections removed.

When the plan is written and verified, run: `tsx scripts/complete-plan.ts $task`

**Important**: Only YOU (the master agent) write the plan file and run the completion script. Sub-agents are for research only.

## Planning Workflow

You will spawn a planning sub-agent to explore the codebase, then YOU (the master agent) handle clarification, writing the plan, and completion.

### Step 1: Explore (sub-agent)

Spawn a planning sub-agent (Task tool, subagent_type=Plan) to explore the codebase. The sub-agent's ONLY job is research — it must NOT write files, run scripts, or ask user questions.

Prompt it with:
- **The Task $task specs context you extracted above** — paste in the task's Outcome, Scope, Touches, and Acceptance criteria from `tasks/specs.md`, plus any relevant Architecture & key decisions. The sub-agent must not have to re-derive what the task is; give it the specs so it investigates the *right* files.
- What to investigate (the slices/files named in **Touches**, plus relevant services, models, tests, and patterns around them)
- To return: relevant files with line numbers, current architecture, dependencies, and any ambiguities it found
- Explicit instruction: "Do NOT write any files, run any scripts, or ask user questions. Only explore and return findings."

### Step 2: Clarify (master agent — you)

Based on the sub-agent's findings:

1. Ask the user questions ONLY if there's genuine ambiguity that could lead to wasted work. Make reasonable assumptions for everything else.

   **ASK**: "Should auth use JWT or sessions?" (architectural choice with real tradeoffs)
   **DON'T ASK**: "Should I remove password confirmation from both UI and model?" (obviously yes)

2. Define the testing strategy before writing the plan:
   - Unit tests (which files/scenarios)
   - Manual browser-testing scenarios via Claude-in-Chrome MCP (if the feature has UI impact)
   - Explicitly state if integration/E2E tests are NOT needed and why

   Ask the user to confirm the testing strategy ONLY when the choice has meaningful tradeoffs, requires unavailable resources, or would materially change scope. Otherwise, record the strategy in the plan and proceed.

3. If no clarification is needed, state the assumptions you are making and proceed.

Do NOT proceed to step 3 until any clarifying questions you asked have been answered. If no questions were needed, proceed directly.

### Step 3: Write the plan (master agent — you)

Write the plan YOURSELF using the Write tool to: `tasks/task-$task.md`

Do NOT delegate file writing to a sub-agent.

The plan must follow every section in the template at @templates/plan-template.md, in the same order, with no sections removed. Add new sections only if the work genuinely requires them. In particular:
- The Overview, Implementation Plan, and To-Do List must be a faithful expansion of the specs' **Outcome / Scope / Touches** — stay inside the task's declared scope (don't pull in work the specs assigned to another task) and respect its **Depends on**.
- The Testing Strategy must cover the specs' **Acceptance criteria** and **Proof** for this task (and any Risk & proof obligation the specs assign to it), reflecting what was confirmed with the user in Step 2.
- The Project Docs Update section may say "Not needed for this change." for minor features, but the section must still be present.

The Overview must make the implementation boundary auditable:
- State what is in scope and what is explicitly out of scope.
- Record assumptions made from dependency tasks or existing architecture.
- Surface important architecture, ownership, data-flow, or dependency decisions that future implementation/review agents must preserve.
- If the specs contain acceptance criteria or proof obligations that are intentionally deferred to another task, name the owning task instead of silently omitting them.

#### Traceability Requirements

Before writing, build a mental checklist from the task specs:
- Outcome
- Scope in/out
- Acceptance criteria
- Proof
- Any global risk/proof obligations owned by this task

Every acceptance criterion and proof item must be covered by at least one Implementation Plan phase or To-Do item, and by at least one Testing Strategy or manual verification item. If coverage is impossible inside this task's declared scope, document the gap explicitly in the Overview and do not invent out-of-scope work.

#### CRITICAL: Agent-Executable Steps Only

Every item in the To-Do List MUST be something the implementation agent can execute autonomously in this environment. The workflow is fully autonomous — there is no user in the loop between planning and PR creation.

**NEVER include To-Do items that require:**
- The user to take an action (e.g., "Commit and push when user requests", "Wait for user approval", "User to test in staging")
- Deployment to production, staging, or any other environment
- Creating, pushing, or merging a pull request — a dedicated PR agent runs after implementation/review and handles `git commit`, `git push`, `gh pr create`, and CI monitoring. Do NOT add commit/push/PR steps to the plan.
- Manual git operations (commit, push, branch management) — the PR agent owns all git workflow
- External services or credentials the agent does not have access to
- Any step gated on "only when explicitly requested by user" or similar conditional user input

If a step cannot be executed by the agent itself end-to-end, leave it out entirely. Do not add it as an unchecked TODO "for later" — unchecked items block the workflow as NEEDS_WORK or BLOCKED.

To-Do items must be concrete and verifiable:
- Name the relevant files, commands, or behavior when knowable.
- Avoid vague action words such as "consider", "investigate", "ensure", "handle", or "support" unless the item also states the exact deliverable.
- Split mixed implementation/testing work into the appropriate sections.
- Testing To-Dos must say what command or scenario proves the work when that is knowable.
- Prefer the project's documented helper commands and existing scripts over ad hoc commands.
- Where a project skill fits the step, name it so `/implementation` reaches for it: `/scaffold-feature`, `/add-api-contract`, `/add-mutation`, `/scaffold-form`, `/react-router`, `/style-component`, `/scaffold-auth`, `/api-error-handling`, `/scaffold-seed`, `/write-tests`. Use the schema-migration subagent for table/migration steps. Naming a skill is a hint, not a contract — the item must still state its concrete deliverable.

The plan ends when code + tests are done. The PR agent takes it from there.

After writing, READ the file back and verify:
- All template sections are present and in order.
- All acceptance criteria and proof items from the specs are covered or explicitly scoped out with a reason.
- No To-Do item requires user action, deployment, external credentials, PR/git workflow, or future-task work.
- The Testing Strategy contains targeted automated checks first, broader checks where appropriate, and browser/manual verification only when relevant.
- The Project Docs Update section says exactly what docs change is needed, or "Not needed for this change."

### Step 4: Complete (master agent — you)

Only after verifying the file contents, run: `tsx scripts/complete-plan.ts $task`

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
1. Start the web (Vite) dev server on your assigned port — the browser hits this: `pnpm dev:web --port <port>`
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
