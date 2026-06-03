# Guide: Hooks

Hooks run **deterministic code at lifecycle events**, configured in `settings.json`. Unlike
rules, skills, and subagents — which shape what Claude *decides* to do — a hook runs no
matter what Claude decides. It is the only **enforcement** mechanism. If something *must*
happen (or must be blocked) at a fixed moment, it's a hook.

> See also: [conventions](./conventions.md) · [when to use what](./README.md#which-mechanism-do-i-use)

## When to use a hook

- **Guarantee an action runs** at a point in the loop: format/lint after every edit, set up
  the environment at session start, validate before a tool call.
- **Block or modify** a tool call deterministically: deny writes to protected paths, rewrite
  a risky command, require confirmation.
- **Inject context automatically**: tell Claude the detected toolchain at session start.
- **React to events** outside the model loop: notify on completion, log activity.

Use something advisory instead (a [rule](./rules.md) or [skill](./skills.md)) when "usually"
is good enough — hooks are for "always".

## Where hooks are configured

| Location | Scope |
| --- | --- |
| `.claude/settings.json` | Project (commit it; shared) |
| `.claude/settings.local.json` | Project, personal (gitignored) |
| `~/.claude/settings.json` | All your projects |
| Managed settings | Organization-wide |

A hook entry references a script; keep scripts in `.claude/hooks/` and call them with the
`${CLAUDE_PROJECT_DIR}` placeholder so the config stays portable.

## The events (most-used)

| Event | Fires | Can block? | Typical use |
| --- | --- | --- | --- |
| `SessionStart` | Session begins/resumes | — | Inject context, set up env |
| `UserPromptSubmit` | Before Claude sees your prompt | ✅ | Validate/augment the prompt |
| `PreToolUse` | Before a tool runs | ✅ | Allow/deny/ask, rewrite input |
| `PostToolUse` | After a tool succeeds | Feedback only | Format/lint, run checks |
| `Stop` | Claude finishes responding | ✅ | Enforce "not done until X" |
| `SubagentStop` | A subagent finishes | ✅ | Post-process subagent output |
| `PreCompact` / `PostCompact` | Around context compaction | ✅ (Pre) | Preserve/restore state |
| `SessionEnd` | Session ends | — | Cleanup |

(There are more — file-watch, MCP, notification, task events — but these cover most setups.)

## settings.json structure

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/post-edit-check.sh\"",
            "timeout": 60,
            "statusMessage": "Formatting & linting edited file..."
          }
        ]
      }
    ]
  }
}
```

- **`matcher`** — which occurrences this entry applies to. For tool events it matches the
  **tool name**: exact (`Bash`), pipe list (`Edit|Write|MultiEdit`), or a regex
  (`mcp__.*__write.*`). Omit/`"*"` to match all. Other events match different things
  (`SessionStart` matches the source: `startup`/`resume`/…).
- **`type`** — usually `command` (a shell script). Also `http`, `mcp_tool`, `prompt` (a
  single-turn LLM check), and `agent`.
- **`timeout`**, **`statusMessage`**, **`async`**, **`once`** — execution controls.

## How a command hook talks to Claude

A command hook receives a **JSON payload on stdin** and communicates back via **exit code**
and **stdout**.

### Input (stdin)

Common fields plus event-specific ones:

```json
{
  "session_id": "…",
  "cwd": "/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "npm install left-pad" }
}
```

For `PostToolUse` on an edit you'd read `tool_input.file_path`; for `UserPromptSubmit`,
`prompt`; for `SessionStart`, `source`.

### Output: exit codes

| Exit | Meaning |
| --- | --- |
| `0` | Success. stdout (if JSON) is parsed for directives. |
| `2` | **Blocking error.** stderr is sent to Claude; the action is blocked on blockable events. |
| other | Non-blocking error; logged, execution continues. |

Exit 2 is how you turn a check into a gate on blockable events. This repo's
[`post-edit-check.sh`](../.claude/hooks/post-edit-check.sh) lints the edited file and, on
errors, prints them to stderr and `exit 2`. Because `PostToolUse` runs after the edit has
already happened, this does not undo or block the edit; it feeds the lint failure back to
Claude so it can fix it before moving on.

### Output: structured JSON (exit 0)

For richer control, print JSON on stdout:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "Lockfile says pnpm but command uses npm.",
    "additionalContext": "…",
    "updatedInput": { "command": "pnpm add left-pad" }
  }
}
```

Key fields:

- **`permissionDecision`** (`PreToolUse`): `allow` / `deny` / `ask` / `defer`. This repo's
  [`guard-package-manager.sh`](../.claude/hooks/guard-package-manager.sh) returns `ask` with
  a reason when a command's package manager contradicts the lockfile — a warning, not a hard
  block.
- **`additionalContext`**: text injected for Claude. This repo's
  [`report-toolchain.sh`](../.claude/hooks/report-toolchain.sh) (a `SessionStart` hook) uses
  it to announce the detected package manager + test runner.
- **`updatedInput`**: rewrite the tool input before it runs.
- Top-level **`decision: "block"`** + **`reason`** is the simpler block form for events like
  `UserPromptSubmit` / `Stop`.

## Three worked examples (in this repo)

| Hook | Event | What it demonstrates |
| --- | --- | --- |
| `report-toolchain.sh` | `SessionStart` | Inject `additionalContext`; sources the shared detector so Claude knows the toolchain from turn one. |
| `post-edit-check.sh` | `PostToolUse` (Edit\|Write\|MultiEdit) | Read `tool_input.file_path`; format + lint; `exit 2` to feed lint errors back. |
| `guard-package-manager.sh` | `PreToolUse` (Bash) | Parse `tool_input.command`; return `permissionDecision: ask` on a toolchain mismatch. |

## Writing robust hook scripts

Hooks run in whatever shell environment the user has — make them defensive:

- **No-op gracefully when irrelevant.** `post-edit-check.sh` exits 0 immediately for non-TS
  files and when the pack/tools aren't present. A hook should never break a session.
- **Don't assume your tools exist.** It checks for `node_modules/.bin/eslint` before linting
  (and never triggers an `npx` auto-install).
- **Don't trust that `node` works.** These hooks parse JSON with `node` *only after*
  verifying it actually executes (`node -e '' >/dev/null 2>&1`), then fall back to
  `grep`/`sed`. A lazy `nvm` shim that's on `PATH` but fails non-interactively is a real
  case this guards against.
- **Mind `set -e` with sourced helpers.** A sourced function that returns non-zero (e.g. "no
  `package.json` found") will abort a script under `set -e`. `report-toolchain.sh` uses
  `set -uo pipefail` (no `-e`) for this reason.
- **Keep them fast.** They're on the critical path of every matching event. Scope tightly
  (single file, not the whole repo) and set a sane `timeout`.
- **Use placeholders, not absolute paths** — `${CLAUDE_PROJECT_DIR}`.

## Hooks affect every session — ship them responsibly

Because hooks run automatically for anyone with the repo, document them and make them
easy to disable. This repo's README lists each hook and notes you can remove an entry or set
`"disableAllHooks": true`. Prefer `ask`/warn over hard `deny` unless a hard block is truly
warranted — a noisy or over-eager hook trains people to disable the whole set.

## Checklist for a hook you're writing

- [ ] The need is "always", not "usually" (else a rule/skill is the better fit).
- [ ] Right event + `matcher`; `command` uses `${CLAUDE_PROJECT_DIR}`.
- [ ] Reads the input it needs from stdin; communicates via exit code / JSON correctly.
- [ ] Blocks with `exit 2` (+ stderr) or `permissionDecision` only when it should.
- [ ] No-ops gracefully; tolerates missing tools and a broken `node`; fast with a `timeout`.
- [ ] Documented and disable-able; warns (`ask`) rather than hard-blocking unless necessary.
