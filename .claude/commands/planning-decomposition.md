---
name: planning-decomposition
description: Break down the brief into a sequenced plan of independently-deliverable tasks, written to `tasks/tasks.md` following the provided structure.
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

## Hard constraints on this step

- **Planning only:** no application code, no running the pipeline, no creating
  `tasks/task-N.md` files. Markdown plan output only.

## Output

Write the overall plan to **`tasks/tasks.md`** with this structure:

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
