# Building effective Claude Code extensions

A field guide to the five ways you extend Claude Code — **rules**, **skills**,
**slash commands**, **subagents**, and **hooks** — with the conventions that make them
reliable. Each guide is practical, example-driven, and grounded in how Claude Code
actually loads and runs these artifacts.

> Every example in these guides is real: it comes from the artifacts shipped in this
> repo's [`.claude/`](../.claude) directory. When a guide references
> `.claude/rules/backend-routes.md` or `.claude/agents/code-reviewer.md`, open it.

## The guides

| Guide | Build this when you want to… |
| --- | --- |
| [**Rules**](./rules.md) | State always-true conventions Claude should follow while editing certain files. |
| [**Skills**](./skills.md) | Package a repeatable procedure, workflow, or reference that loads on demand. |
| [**Slash commands**](./slash-commands.md) | Give yourself a `/command` you trigger explicitly (a skill you invoke). |
| [**Subagents**](./subagents.md) | Hand a self-contained task to an isolated context with its own model and tools. |
| [**Hooks**](./hooks.md) | Run deterministic code at a lifecycle event, regardless of what Claude decides. |

There's also a [**conventions cheat sheet**](./conventions.md) collecting the quality bar
that applies across all five (WHEN/WHEN-NOT descriptions, model routing, examples,
checklists, `references/` directories).

## Which mechanism do I use?

The single most common mistake is reaching for the wrong tool. Use this decision order:

1. **Does it need to run automatically at a fixed moment, no matter what Claude decides?**
   (Before a tool call, after every edit, at session start.) → **Hook.** Hooks are the only
   mechanism that is *enforced* rather than *advisory*.
2. **Is it an always-true fact or convention for certain files?**
   (How handlers are structured, the test style, naming.) → **Rule.** It loads into context
   automatically when Claude touches matching files.
3. **Is it a multi-step procedure, workflow, or chunk of reference material?**
   (Scaffold a feature, cut a release, the zod patterns cheat sheet.) → **Skill.** It loads
   only when relevant or invoked, so it costs nothing until needed.
4. **Should *you* control exactly when it runs?** (Deploy, commit, send a message.)
   → **Skill with `disable-model-invocation: true`** — i.e. a **slash command**.
5. **Would the task flood the main conversation with output you won't reference again, or
   benefit from a different model / restricted tools?** (Review a diff, run the test suite,
   research the codebase.) → **Subagent.** It works in its own context window and returns
   only a summary.

### The same intent, expressed five ways

Take "our Express handlers must be thin: parse with zod, call a service, return." Notice how
the mechanism changes what happens:

| Mechanism | What it does with that intent |
| --- | --- |
| **Rule** (`backend-routes.md`) | Loads the convention into context whenever Claude edits a route file, so new code follows it. *Advisory.* |
| **Skill** (`scaffold-feature`) | Generates new handlers already shaped that way. *On demand.* |
| **Subagent** (`code-reviewer`) | Reads a diff and flags handlers that violate it. *Isolated review.* |
| **Hook** (`post-edit-check`) | Runs the linter after each edit; an ESLint rule that bans logic in handlers blocks the edit. *Enforced.* |
| **Slash command** (`/run-checks`) | You trigger the full typecheck+lint+test gate when you decide to. *User-controlled.* |

They're complementary, not competing. A mature setup uses all five: rules keep code on-pattern,
skills generate and operate, subagents review, hooks enforce, commands give you manual control.

## A loading-model mental picture

Context is the scarce resource. Knowing *when* each artifact enters the context window is
what separates a setup that helps from one that just bloats every prompt.

```
Session start ──────────────────────────────────────────────────────────
  • CLAUDE.md (full)                          ← always in context
  • Rules with no `paths:` (e.g. architecture)← always in context
  • SessionStart hooks run                    ← inject context once

While you work ─────────────────────────────────────────────────────────
  • Path-scoped rules load when Claude reads/edits matching files
  • A skill loads when its description matches your request, or you type /name
  • A subagent spins up its own separate context window on delegation
  • PreToolUse / PostToolUse hooks fire around each tool call
```

The corollaries:

- **Rules and CLAUDE.md are recurring costs** — keep them short and scoped. A 400-line rule
  that loads on every `.ts` edit taxes every turn.
- **Skills are nearly free until used** — put the long reference material there, in
  `references/` files that load only when the skill needs them.
- **Subagents protect the main context** — that's their primary value, beyond model routing.
- **Hooks cost nothing in context** — they're shell-level, outside the model loop.

Start with [conventions](./conventions.md) for the cross-cutting quality bar, then dive into
the guide for whatever you're building.
