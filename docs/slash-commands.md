# Guide: Slash commands

A slash command is a skill **you trigger explicitly** by typing `/name`. In current Claude
Code, commands and skills are the same mechanism — a file at `.claude/commands/deploy.md`
and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy`. The distinction that
matters is **who invokes it** and **whether Claude may run it on its own**.

> Read the [skills guide](./skills.md) first — everything there applies. This guide focuses
> on the command-specific concern: controlling invocation.

> See also: [conventions](./conventions.md) · [when to use what](./README.md#which-mechanism-do-i-use)

## When to make something a command (vs an auto-loading skill)

Make it a **command** (`disable-model-invocation: true`) when the action has
**side effects or timing you must control**:

- `/deploy`, `/release`, `/commit`, `/send-slack-message` — you don't want Claude deciding
  your code "looks ready" and shipping it.
- `/run-checks` — but here it's fine for Claude to also run it before finishing, so this
  repo leaves model-invocation **enabled** (see below).

Leave it an **auto-loading skill** (the default) when Claude running it at the right moment
is helpful and safe — generators, formatters, reference loaders.

The rule of thumb: **side effects → user-triggered; pure/safe work → let Claude help.**

## Two ways to author a command

Both produce `/deploy`. Prefer the skill form unless you want a one-liner.

**Skill form** (recommended — supports `references/`, bundled scripts):

```
.claude/skills/deploy/SKILL.md
```
```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---
Deploy $ARGUMENTS to production:
1. Run the test suite …
```

**Command-file form** (legacy, still supported — single file, same frontmatter):

```
.claude/commands/deploy.md
```

## The defining frontmatter: `disable-model-invocation`

```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true   # only YOU can run /deploy
---
```

- `true` → the command never auto-loads; Claude can't decide to run it. It also won't be
  preloaded into subagents. This is what makes it a "command" in spirit.
- Omitted/`false` → Claude may also load it automatically when relevant (it behaves like
  any skill).

The mirror-image field is `user-invocable: false`, which hides a skill from the `/` menu so
*only Claude* can use it — the opposite of a command. Don't set both.

## Arguments

Commands frequently take arguments. Declare names for clean substitution:

```yaml
---
argument-hint: "[environment] [--skip-tests]"
arguments: [environment]
---
Deploy to $environment. Full argument string: $ARGUMENTS.
```

- `argument-hint` shows in autocomplete so you remember the shape.
- `$environment` (named), `$1`/`$2` (positional), and `$ARGUMENTS` (everything) all work.

This repo's [`/scaffold-feature`](../.claude/skills/scaffold-feature/SKILL.md) takes
`[feature-name] [full|api|ui]` and branches on `$mode`.

## Dynamic context: bash and file references

Inside the body you can run shell and inject files, so the command operates on live state:

- `` !`command` `` or a ```` ```! ```` block — runs a shell command and injects its output.
  This repo's commands open with
  `bash "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"` to ground themselves in the
  real toolchain before doing anything.
- `@path/to/file` — injects file contents.

Use these to make a command act on *what's true now* rather than what Claude guesses.

## Worked example: `/run-checks`

[`run-checks`](../.claude/skills/run-checks/SKILL.md) is a quality-gate command:

```yaml
---
name: run-checks
description: Run the project's quality gate — typecheck, lint, tests, and build …
when_to_use: >-
  Use WHEN asked to run checks, verify the build, or before finishing a change.
  Safe for Claude to run on its own before declaring work done.
model: inherit
---
```

Design decisions worth copying:

- **`model: inherit`** — a gate should run on whatever model you're already using; no reason
  to pin one.
- **Model-invocation left enabled** — running checks has no harmful side effects, and you
  *want* Claude to self-verify before saying "done". Contrast `/deploy`, which you'd lock to
  user-only.
- **Routes everything through `detect-toolchain.sh`** — `run_typecheck`, `run_lint`,
  `run_tests`, `run_build` — so it never hardcodes a runner.
- **Defines the report format** — ✅/❌ per step with concise, actionable failure detail.

## Checklist for a command you're writing

- [ ] Decided invocation: side-effecting → `disable-model-invocation: true`; safe → leave
      auto-load on.
- [ ] `description`/`when_to_use` describe when to run it (and what not to use it for).
- [ ] `argument-hint` (and `arguments:`) set if it takes input.
- [ ] Grounds itself in live state via `` !`…` `` / `@file` where relevant.
- [ ] Routes any commands through runtime toolchain detection.
- [ ] Specifies the output/report it should produce, and ends with a checklist.
