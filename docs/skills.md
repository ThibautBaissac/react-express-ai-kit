# Guide: Skills

A skill packages a repeatable procedure, workflow, or body of reference material into a `SKILL.md` file that Claude loads **on demand** — when your request matches its description, or when you invoke it with `/skill-name`.
Because it loads only when needed, a skill can carry deep reference material that costs almost nothing until used.

> Custom commands and skills are the same mechanism.
> A skill you trigger manually is a [slash command](./slash-commands.md) — that guide covers the `disable-model-invocation` pattern.
> This guide covers skills in general.

> See also: [conventions](./conventions.md) · [when to use what](./README.md#which-mechanism-do-i-use)

## When to use a skill

- A **multi-step procedure** you'd otherwise paste repeatedly: scaffold a feature, add an API contract, cut a release.
- **Reference material** that's too big for a rule and only needed sometimes: zod patterns, testing recipes, a style playbook.
- A workflow that should be **discoverable** (`/name`) and/or **auto-invoked** when relevant.

Use something else when the content is an always-true convention ([rule](./rules.md)), must run deterministically ([hook](./hooks.md)), or is a self-contained delegated task that would clutter your context ([subagent](./subagents.md)).

## Anatomy

```
.claude/skills/scaffold-feature/
├── SKILL.md                       # required: frontmatter + instructions
└── references/                    # optional: loaded on demand
    ├── layout-detection.md
    └── slice-templates.md
```

The **directory name** becomes the command (`/scaffold-feature`). `SKILL.md` is the entry point; everything else is optional supporting material you reference from it.

## Frontmatter reference

Only the body is strictly required, but a real skill sets `description` (and usually `when_to_use`).
All documented fields:

```yaml
---
name: scaffold-feature              # display label
description: >-                     # what it does — drives auto-loading
  Scaffold a vertical-slice feature: shared zod contract, backend route → service →
  repository, frontend component → hook → store, and colocated tests.
when_to_use: >-                     # WHEN / WHEN-NOT triggers (appended to description)
  Use WHEN the user asks to add/create a feature, endpoint, resource, or CRUD. Do NOT
  use for editing existing files or DB schema changes (use the schema-migration subagent).
argument-hint: "[feature-name] [full|api|ui]"   # shown in autocomplete
arguments: [feature, mode]          # named positional args → $feature, $mode
model: sonnet                       # model while the skill is active
---
```

| Field | Purpose |
| --- | --- |
| `name` | Display label in listings. (The command name comes from the directory.) |
| `description` | What the skill does. **The primary auto-load signal.** |
| `when_to_use` | Extra triggers/phrases. Appended to `description`; counts toward the 1,536-char cap. |
| `argument-hint` | Autocomplete hint, e.g. `[issue-number]`. |
| `arguments` | Named positional args for `$name` substitution. |
| `disable-model-invocation` | `true` → only *you* can run it (`/name`). Makes it a command. |
| `user-invocable` | `false` → only *Claude* can load it; hidden from the `/` menu. For background knowledge. |
| `allowed-tools` | Tools Claude may use without a permission prompt while the skill is active. |
| `disallowed-tools` | Tools removed from the pool while active (e.g. block `AskUserQuestion` in a loop). |
| `model` | Model override for the active turn(s). Same values as `/model`, or `inherit`. |
| `effort` | Effort override: `low`/`medium`/`high`/`xhigh`/`max`. |
| `context` | `fork` → run the skill in a forked subagent context. |
| `paths` | Glob list — auto-load only when working with matching files (like a rule). |
| `shell` | `bash` (default) or `powershell` for inline command blocks. |

### The two invocation-control fields

These define *who* can trigger a skill, and they're the most important behavioral knobs:

| | Claude can auto-load | You can `/invoke` | Use for |
| --- | --- | --- | --- |
| *(default)* | ✅ | ✅ | Most skills — generators, helpers |
| `disable-model-invocation: true` | ❌ | ✅ | Side-effecting actions: `/deploy`, `/commit` |
| `user-invocable: false` | ✅ | ❌ | Pure background knowledge: "how the legacy billing system works" |

## String substitution in the body

Inside `SKILL.md` you can interpolate:

| Token | Expands to |
| --- | --- |
| `$ARGUMENTS` | All args as one string |
| `$1`, `$2`, … | Positional args (shorthand for `$ARGUMENTS[N]`) |
| `$name` | A named arg declared in `arguments:` |
| `${CLAUDE_SKILL_DIR}` | The skill's own directory (use for bundled scripts/files) |
| `${CLAUDE_SESSION_ID}` | Current session id |
| `${CLAUDE_EFFORT}` | Current effort level |

This repo's `scaffold-feature` uses `$feature` and `$mode` (declared via `arguments: [feature, mode]`) to parameterize the slice it generates.

## Progressive disclosure: keep the body lean, push depth to `references/`

The body of a loaded skill **stays in context across turns**.
So the body should be the *procedure*; the bulky material belongs in `references/` files the skill reads only when it reaches that step.

```markdown
## Step 3 — Generate the slice
Read `references/slice-templates.md` for the canonical templates and adapt them. Order:
1. Shared contract …
```

Compare the two files in [`scaffold-feature`](../.claude/skills/scaffold-feature/): the `SKILL.md` is a tight 5-step procedure; the heavy templates and layout-detection heuristics live in `references/` and load only when that step runs.
That's the pattern to copy.

## A strong skill, step by step

Using [`add-api-contract`](../.claude/skills/add-api-contract/SKILL.md) as the model:

1. **Frontmatter** with a WHEN/WHEN-NOT description, an `argument-hint`, and a routed `model`.
2. **A numbered procedure** — each step is an imperative instruction, not prose.
   "Locate the shared module", "Define schema first, derive types", "Wire the backend", "Verify".
3. **Delegate detail to a reference** — "Read `references/zod-patterns.md` and apply it" — instead of inlining 100 lines of patterns.
4. **A verify step** that runs the real toolchain (`source detect-toolchain.sh; run_typecheck`).
5. **A closing checklist** that restates the invariants ("Type is `z.infer`; variants derived; both sides import the same schema").

### Make skills do real work, not just talk

A skill that runs commands should detect the toolchain rather than assume it.
Every skill in this repo opens with:

```bash
bash "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

…and verifies with `run_typecheck` / `run_tests`.
The result: the skill works whether the project uses pnpm+Vitest or npm+Jest, with no edits.

## Common mistakes

- **Vague description** → the skill never auto-loads.
  Put the user's words and the exclusions in `description`/`when_to_use`.
- **Everything in `SKILL.md`** → recurring token cost and a wall of text.
  Move references out.
- **A side-effecting skill Claude can trigger** → set `disable-model-invocation: true` so *you* decide when to deploy/commit/send.
- **Narrating instead of instructing** → "First, it's important to understand that…" wastes tokens.
  Say "Parse the body with the shared schema."
- **Hardcoded `npm`/`vitest`** → detect at runtime instead.

## Checklist for a skill you're writing

- [ ] Directory name is the command you want (`/that-name`).
- [ ] `description` + `when_to_use` give concrete WHEN/WHEN-NOT triggers, under 1,536 chars.
- [ ] Body is an imperative, numbered procedure — lean and skimmable.
- [ ] Bulky templates/reference live in `references/` and are linked from the body.
- [ ] `model` routed appropriately; `disable-model-invocation`/`user-invocable` set if needed.
- [ ] Any commands route through runtime detection (no hardcoded toolchain).
- [ ] Includes a verify step and a closing checklist.
