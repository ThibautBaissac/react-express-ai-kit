# Guide: Subagents

A subagent is a specialized assistant that runs in its **own context window**, with its own **system prompt**, **model**, and **tool access**.
Claude delegates a task to it; the subagent works independently and returns only its result.
The two payoffs: the side task doesn't flood your main conversation, and you can route it to a cheaper or stronger model.

> See also: [conventions](./conventions.md) · [when to use what](./README.md#which-mechanism-do-i-use)

## When to use a subagent

- The task would **dump output you won't reference again** into the main context — searching the codebase, running a noisy test suite, reading dozens of files.
  The subagent absorbs that and hands back a summary.
- You want a **different model** for it — opus for a careful review, haiku for mechanical grind.
- You want **restricted, enforced tool access** — a reviewer that physically cannot edit files.
- You keep spawning the **same kind of worker** with the same instructions — capture it once.

Use something else when the guidance is an always-on convention ([rule](./rules.md)), a procedure you run inline ([skill](./skills.md)), or deterministic enforcement ([hook](./hooks.md)).

## Where subagents live

| Location | Scope | Priority |
| --- | --- | --- |
| `.claude/agents/*.md` | Project (commit it) | higher |
| `~/.claude/agents/*.md` | All your projects | lower |

`.claude/agents/` is scanned **recursively**, and identity comes only from the `name` frontmatter field — not the path or filename.
Two consequences:

- You can organize into subfolders (`agents/review/…`), but **keep `name` values unique**; duplicates within a scope are silently discarded.
- **Do not put non-agent markdown under `.claude/agents/`** (e.g. a shared checklist) — it gets scanned as an agent.
  Put reference docs in a neutral dir like `.claude/references/` and have the agent `Read` them.
  This repo keeps `security-checklist.md` and `orm-detection.md` in `.claude/references/` for exactly this reason.

## Frontmatter reference

The body is the system prompt.
Only `name` and `description` are required.

```yaml
---
name: code-reviewer
description: >-
  Expert reviewer for React + Express + TypeScript changes. Use PROACTIVELY after writing
  or modifying code to check layering, typed contracts, and KISS/DRY/SRP/YAGNI before
  committing. Reviews the working diff and returns prioritized findings.
tools: Read, Grep, Glob, Bash
model: opus
color: blue
---
You are a senior reviewer for a modular React + Express + TypeScript codebase…
```

| Field | Purpose |
| --- | --- |
| `name` | Unique id (lowercase + hyphens). Hooks receive it as `agent_type`. |
| `description` | **When Claude should delegate here.** The routing signal. |
| `tools` | Allowlist of tools. **Omit to inherit all.** |
| `disallowedTools` | Denylist; removed from the inherited/listed set. |
| `model` | `haiku` / `sonnet` / `opus` / full id / `inherit`. Default `inherit`. |
| `permissionMode` | `default` / `acceptEdits` / `auto` / `dontAsk` / `bypassPermissions` / `plan`. |
| `maxTurns` | Cap on agentic turns. |
| `skills` | Skills to **preload** into the subagent's context at startup. |
| `memory` | `user` / `project` / `local` — enables cross-session memory. |
| `effort` | Effort override. |
| `isolation` | `worktree` → run in a temporary git worktree (isolated repo copy). |
| `background` | `true` → always run as a background task. |
| `color` | Display color in the task list/transcript. |
| `initialPrompt` | Auto-submitted first turn when run as the main agent. |

### Tool access: allowlist vs denylist

```yaml
tools: Read, Grep, Glob, Bash          # exactly these (a read-only reviewer)
```
```yaml
disallowedTools: Write, Edit           # inherit everything except file writes
```

If both are set, `disallowedTools` is applied first, then `tools` is resolved against what remains.
Note some tools are **never** available to subagents regardless of `tools`: `Agent`, `AskUserQuestion`, `EnterPlanMode`, `ScheduleWakeup`, `WaitForMcpServers` (and `ExitPlanMode` unless `permissionMode: plan`).
Design subagents to *return findings*, not to ask the user questions mid-run.

### Model resolution order

When Claude invokes a subagent, the model is chosen as: `CLAUDE_CODE_SUBAGENT_MODEL` env → per-invocation override → the `model:` frontmatter → the main conversation's model.

## Routing: matching the model to the job

The four subagents in this repo show the spectrum:

| Subagent | Model | Why |
| --- | --- | --- |
| [`code-reviewer`](../.claude/agents/code-reviewer.md) | **opus** | Judgment-heavy review across layering, contracts, design. |
| [`security-reviewer`](../.claude/agents/security-reviewer.md) | **opus** | High-stakes reasoning about exploitability. |
| [`schema-migration`](../.claude/agents/schema-migration.md) | **sonnet** | Everyday structured code generation, ORM-adaptive. |
| [`test-runner`](../.claude/agents/test-runner.md) | **haiku** | Mechanical: run tests, parse output, summarize. |

`test-runner` is the clearest case for *both* subagent benefits at once: tests produce huge output (keep it out of main context) and the work is mechanical (haiku is fast and cheap).

## Writing the system prompt (the body)

The body is the entire system prompt — the subagent does **not** see the main Claude Code system prompt, only this plus basic environment info.
Structure it like a focused job spec:

1. **Role and boundary.** "You review… You do not modify files."
   State what it must *not* do.
2. **How to scope its work.** For a reviewer: `git diff HEAD`; tell it what to do if empty.
3. **What to check / do, in priority order.** Concrete, enumerated — see how `code-reviewer` lists layering → contracts → typing → React → disciplines → tests.
4. **Output format.** Subagents return a summary; *define* it. `code-reviewer` specifies 🔴/🟡/🟢 severities and a one-line verdict, so the result is consistently actionable.
5. **Pointers to references.** "Read `.claude/references/security-checklist.md` and apply it" keeps the prompt lean while giving depth on demand.

### A good `description` drives delegation

The body governs behavior; the **description** governs *when Claude hands off*.
Make it explicit, and add "Use PROACTIVELY" when you want Claude to reach for it without being asked (as `code-reviewer` does for post-change review).

## Invoking subagents

- **Automatic** — Claude delegates when a task matches the `description`.
- **Explicit** — ask for it: "use the security-reviewer on this diff."
- **Background / parallel** — `background: true`, or spawn several to fan out work.

## Common mistakes

- **No tool restriction on a reviewer** → it might "helpfully" edit code.
  Lock it to `Read, Grep, Glob, Bash`.
- **Reference docs under `.claude/agents/`** → mis-scanned as agents.
  Use `.claude/references/`.
- **Designing it to ask questions** → `AskUserQuestion` isn't available; have it return findings and note what it couldn't assess.
- **Undefined output** → a rambly summary.
  Specify the format.
- **Wrong model** → opus on mechanical grind (wasteful) or haiku on nuanced review (misses).

## Checklist for a subagent you're writing

- [ ] `name` unique; `description` says when to delegate (with "PROACTIVELY" if apt).
- [ ] `model` routed to the work (haiku/sonnet/opus).
- [ ] `tools` restricted to what the job needs (read-only for reviewers).
- [ ] Body: role + boundary, scoping, prioritized steps, **defined output format**.
- [ ] Reference docs live outside `.claude/agents/`; the body points to them by path.
- [ ] Returns findings/results; doesn't rely on asking the user mid-run.
