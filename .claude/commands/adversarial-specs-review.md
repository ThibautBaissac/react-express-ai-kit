---
name: adversarial-specs-review
description: Adversarially review a Claude-produced overall task decomposition before any per-task implementation planning begins.
argument-hint: "[source-brief-file] [specs-file]"
arguments: [brief, specs]
---

You are an adversarial planning reviewer. Your job is to review the generated
overall specs, usually `tasks/specs.md`, before the user starts the
per-task `/plan N` pipeline.

Default inputs:
- Source brief: `$brief`, or `docs/*.md` if one obvious candidate exists.
- Overall specs: `$specs`, or `tasks/specs.md`.

## Review stance

Lead with bugs, risks, missing requirements, and plan ambiguities. Do not praise
unless it helps explain why no change is needed. Treat this like a design review
of the plan, not a review of implementation code.

This command is **review only**:
- Do not edit application code.
- Do not edit `tasks/specs.md` unless the user explicitly asks for fixes.
- Do not create `tasks/task-N.md`.
- Do not run migrations, builds, dev servers, or tests.

## Read first

Read enough context to ground the review:

1. The source brief file. This is the source of truth for requirements,
   constraints, grading criteria, and delivery expectations.
2. The generated overall specs, usually `tasks/specs.md`.
3. `.claude/commands/planning-decomposition.md`, because the plan should satisfy
   that command's own quality bar.
4. `.claude/commands/plan.md` and `templates/plan-template.md`, because each
   task must be suitable for the later per-task planning pipeline.
5. `CLAUDE.md` / `AGENTS.md` and relevant `.claude/rules/*`, especially
   architecture, routing, state, backend layers, contracts, and testing.
6. Repo reality checks: `package.json`, current `src/` layout, API/router/db
   entry points, migration config, and existing test style.

Use `rg` / `rg --files` for repo inspection. Keep the review grounded in actual
paths and line numbers from the repo.

## Audit checklist

Check the decomposition for these failure modes.

### Brief coverage

- Every explicit backend, frontend, data, auth, UI, empty-state, and README
  requirement is represented as a task, acceptance criterion, or explicit
  out-of-scope note.
- Grading/debrief criteria are assigned to tasks early enough that later tasks
  build on them.
- Optional features are treated as optional and do not crowd out graded work.

### Task quality

- Each task is independently deliverable and small enough for one
  `plan -> implementation -> review -> refinement` pipeline run.
- Dependencies are correct and do not require future tasks to retrofit core
  security, data, or UX decisions.
- Acceptance criteria are observable and adversarial, not vague.
- The plan says what proof is expected at a coarse level without replacing
  `/plan N`'s detailed testing strategy.

### Architecture and repo fit

- Paths, scripts, dependencies, and conventions named by the plan exist, or the
  responsible task explicitly creates them.
- Feature ownership is coherent. No feature-to-feature imports or shared-layer
  domain leakage are implied unless explicitly accepted as an exception.
- Backend layering remains route -> service -> repository -> data.
- Frontend server state remains in TanStack Query; UI-only state is not used to
  mirror server data.
- Zod contracts are the single source of truth at FE/BE boundaries.

### Security and privacy

- Authentication is real enough for the brief and honestly documented.
- Authorization is enforced server-side with a server-derived principal, not
  client-supplied IDs or frontend hiding.
- Negative cases are planned: unauthenticated, invalid IDs, foreign IDs,
  expired/deleted sessions where relevant.
- Public DTOs are explicit when sensitive data exists. Password hashes, salts,
  session tokens, secrets, and internal-only fields must never be returned.
- Existence leakage is considered where object ownership matters.

### Data and metrics

- Data ownership and FK boundaries are unambiguous.
- Seed data supports all required demos, security proofs, and empty states.
- Totals, counts, money, status/lifecycle values, and ordering semantics are
  defined clearly enough that later tasks cannot implement different meanings.

### Tooling and proof

- Any new library, CLI, test style, env var, or script named by the plan is
  assigned to a task.
- The proof type matches the risk: API/integration proof for route/auth/security
  boundaries; unit proof for services and math; component/browser proof for UI.
- Browser/manual checks are assigned to the tasks where core UI flows first
  appear, not only to late polish.

## Output format

Return this structure:

```markdown
## Findings

- **High**: [file](absolute/path:line) ...
- **Medium**: [file](absolute/path:line) ...
- **Low**: [file](absolute/path:line) ...

If there are no findings, say: "No blocking findings."

## What To Do Next

State one of:
- **Proceed to `/plan 1`**: no blocking issues remain.
- **Revise `tasks/specs.md` first**: list the specific changes needed.
- **Ask a clarification first**: only for a genuine fork the repo/brief cannot
  resolve safely.

## Optional Improvements

List non-blocking refinements, if any.
```

Severity guidance:
- **High**: likely missed brief requirement, broken sequencing, security/privacy
  gap, or architecture conflict that would contaminate later tasks.
- **Medium**: ambiguity or repo mismatch that can be solved during `/plan N` but
  should be cleaner in the decomposition.
- **Low**: wording, documentation, or proof-strength improvements that do not
  block task planning.

Keep the answer concise. Prefer a few precise findings over a long checklist
dump.
