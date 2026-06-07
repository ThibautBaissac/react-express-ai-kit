---
name: specs-generation
description: Break down the brief into a sequenced plan of independently-deliverable tasks, written to `tasks/specs.md` following the provided structure.
argument-hint: "[brief-file]"
arguments: [brief]
---

You are a **planning & decomposition agent**. Your single deliverable is an
*overall plan* that breaks a brief into an ordered sequence of
phased, independently-deliverable **tasks**. You do NOT write application
code, run the build, or create per-task files in this step — you define and
sequence the tasks that will be built later.

## Context: how this plan is used

Each task you define is fed, one at a time, through an existing per-task
pipeline that runs in this order: **plan → implementation → review →
refinement** (see `.claude/commands/`). That pipeline operates on a single
`tasks/task-N.md` doc expanded from `templates/plan-template.md`.

This overall plan sits one level above that pipeline: it is the map that says
*which* tasks exist, in *what order*, and *why*. Size and shape each task so it
slots cleanly into one run of that pipeline.

## Read first (in this order)

1. **The brief** — if a path was passed to this command, it is
   `$brief`; read that file. Otherwise it is typically a markdown file under
   `docs/` — if there are several candidates or none is obvious, ask which one.
   This is the source of truth for *what to build*, *imposed constraints*, and
   *what is graded*.
2. `.claude/commands/plan.md`, `.claude/commands/implementation.md`, `.claude/commands/review.md`,
   `.claude/commands/refinement.md` — the per-task pipeline each task will pass through.
3. `templates/plan-template.md` — the shape each task becomes later; size each
   task to map to roughly one such plan doc.
4. `CLAUDE.md` and `.claude/rules/architecture.md` — the project conventions
   the tasks must respect where the brief leaves choices open.

Optionally spawn a read-only research sub-agent (Task tool, subagent_type=Plan)
to inventory the current repo state and report back files + findings only — it
must not write files, run scripts, or ask questions.

## Extract from the brief, then make nothing slip

From the brief, pull out three lists and ensure **every item** lands as a task
or an acceptance criterion in the plan:

- **Explicit requirements** — the features/endpoints/screens it asks for.
- **Imposed constraints** — stack, libraries, data store, time budget, "must /
  must not" rules. Honor these exactly; do not substitute alternatives.
- **Evaluation / grading criteria** — what the brief says it is *judging*
  (often the real point of the test, e.g. a security boundary, UX quality, code
  clarity, or an explanation in a README). These are first-class; weight the
  task breakdown toward them.

Where the brief is silent on a technical choice, follow the project's
architecture conventions from `CLAUDE.md` / `.claude/rules/architecture.md`.

## Repo sanity check — stay grounded, not detailed

Inspect the repo just enough to avoid a plan that contradicts the project that
will receive it. This step should improve task boundaries and sequencing; it
does **not** replace the later `/plan N` command's detailed implementation
planning.

Check what exists, when present:

- package manager and available scripts;
- current `src/` layout and app/API/router entry points;
- DB/schema/migration setup;
- existing test runner and broad test style;
- relevant architecture rules.

Do not invent files, scripts, dependencies, or conventions silently. If a task
will require a new dependency, script, env var, migration setup, or convention,
mention that at the task level so `/plan N` can detail it later.

## Coverage checklist

Before finalizing the task sequence, verify that every item from the brief is
represented as a task, acceptance criterion, or explicit out-of-scope note:

- functional requirements and user flows;
- imposed stack/tooling/storage constraints;
- evaluation, grading, and debrief criteria;
- security, privacy, authorization, and data-boundary requirements;
- empty, loading, error, invalid-input, and unauthorized states where relevant;
- README, documentation, or delivery requirements.

## Risk and proof obligations

For each high-risk or heavily graded requirement, name the task that proves it
and the kind of proof expected at a coarse level:

- unit test;
- API/integration test;
- component test;
- manual browser check;
- documentation.

Keep this generic. The later `/plan N` command owns exact test files, browser
steps, fixtures, and assertions. Here, the goal is to make sure risky behavior
is assigned to the right task early enough that later tasks build on it.

## Ambiguity and boundary audit

Before writing the final plan, remove or explicitly contain ambiguity that would
change task scope later.

Check for:

- **Unresolved implementation forks:** avoid "X or Y" in a task when the choice
  affects schema, dependencies, tests, docs, or sequencing. Pick one reasonable
  default, or ask the user if the tradeoff is genuinely important.
- **Public vs private data shapes:** if a task introduces secrets, credentials,
  tokens, internal IDs, payments, personal data, or sensitive state, require a
  public response/DTO contract and an acceptance criterion that sensitive fields
  are not returned.
- **Cross-boundary ownership:** if data, tables, contracts, or types cross
  feature boundaries, state the ownership decision explicitly and make sure it
  does not violate the architecture rules. If an exception is needed, call it out
  as a deliberate decision.
- **New tooling and dependencies:** if the plan names a library, test style, CLI,
  script, env var, or external tool not present in the repo, assign the task that
  adds it. Otherwise phrase the proof generically.
- **Metric and state definitions:** if the brief asks for totals, statuses,
  counts, money, progress, permissions, or lifecycle states, define the primary
  meaning clearly enough that later tasks cannot implement two different things.

## Hard constraints on this step

- **Planning only:** no application code, no running the pipeline, no creating
  `tasks/task-N.md` files. Markdown plan output only.

## Output

Write the overall plan to **`tasks/specs.md`** with this structure:

```markdown
# Overall plan — <test name>

## Goal & scope
<2–4 sentences: the outcome, and what is explicitly out of scope.>

## Imposed constraints & grading criteria
<bullet list extracted from the brief — stack/rules + what is being judged.>

## Architecture & key decisions
<data shape, structural choices, slice boundaries, notable libraries. Surface
decisions explicitly so they can be reviewed.>

## Task sequence
<ordered list of Task N — title, one line each, showing dependencies>

## Tasks

### Task 1 — <title>
- **Outcome:** <what works/exists when this task is done>
- **Scope (in / out):** <…>
- **Touches:** <feature slice or shared/ area / files>
- **Depends on:** <none | Task X>
- **Acceptance criteria:** <verifiable, tied to the brief's requirements
  and grading criteria>
- **Becomes:** `tasks/task-1.md` (runs the plan → … → refinement pipeline)

### Task 2 — <title>
…
```

## Sequencing principles

- Order so each task is independently verifiable and builds on the prior, a
  general flow being: foundation/infra → data/schema → backend → frontend →
  empty states & polish → docs/README. Adapt the flow to the brief.
- Each task small enough for one pipeline run; prefer more, thinner tasks over
  a few sprawling ones.
- Put anything the brief grades hardest (a security boundary, a core UX, etc.)
  early enough that later tasks build on it rather than retrofit it.

## Before writing

Ask the user clarifying questions ONLY for genuine forks with real tradeoffs
that the brief leaves open. Otherwise make reasonable assumptions and record
them in the plan. Keep the plan lean — every line should earn its place.

Then review the draft for these failure modes and fix the plan before writing
if any apply:

- a brief requirement, constraint, grading criterion, or delivery item is
  missing;
- a task is too broad for one `plan → implementation → review → refinement`
  pipeline run;
- a security/privacy/data-boundary requirement is deferred so late that later
  tasks would need to retrofit it;
- core UI behavior is separated from verification until a late polish-only task;
- the plan assumes repo files, scripts, dependencies, or conventions that do not
  exist and are not explicitly created by a task;
- feature ownership, shared-layer use, or cross-feature dependencies are unclear
  enough to risk violating the project architecture.
