# Cross-cutting conventions

The quality bar that applies to **every** artifact type. The per-type guides assume these.

## 1. Descriptions decide everything (WHEN / WHEN-NOT)

For rules (`description` is implicit in the filename + content), skills, and subagents,
the `description` is the single biggest factor in whether the artifact is used at the
right time. Claude reads descriptions — not bodies — to decide what to load or delegate to.

Write descriptions that say **when to use it and when not to**, in concrete terms:

```yaml
# ❌ vague — Claude can't tell when this applies
description: Helps with API stuff.

# ✅ specific, with triggers and exclusions
description: >-
  Create or extend a shared zod schema that crosses the FE/BE boundary, then wire it
  into backend validation and a typed frontend call.
when_to_use: >-
  Use WHEN adding/changing an API request/response shape or DTO shared between the
  Express backend and React frontend. Do NOT use for internal-only types or for DB
  schema/migrations (use the schema-migration subagent).
```

Include the words a user would actually say ("add a field to the payload", "scaffold a
feature"), and name the *other* artifact to use for adjacent cases so Claude routes
correctly instead of misfiring.

For skills, `description` + `when_to_use` together are capped at **1,536 characters** — be
dense, not long.

## 2. Smart model routing

Match the model to the work. For subagents (`model:` frontmatter) and skills that set a
`model:`:

| Model | Use for | Examples in this repo |
| --- | --- | --- |
| **haiku** | Mechanical, high-volume, low-judgment work | `test-runner` (run tests, summarize) |
| **sonnet** | Everyday coding, generation, structured edits | `scaffold-feature`, `add-api-contract`, `schema-migration` |
| **opus** | Review, security, architecture, orchestration | `code-reviewer`, `security-reviewer` |

Default to `inherit` when the work should match whatever the user is already running
(e.g. `/run-checks`). Don't pin opus on a mechanical task — it's slower and costlier with
no benefit.

## 3. Show, don't just tell — inline good/bad examples

A rule that says "keep handlers thin" is weaker than one that shows a thin handler beside
a fat one. Use ✅/❌ pairs liberally. Models pattern-match; give them the pattern.

```ts
// ❌ logic + data access in the handler
router.post("/x", async (req, res) => { if (req.body.n < 0) ...; await db.insert(...); });

// ✅ parse → delegate → respond
router.post("/x", async (req, res, next) => {
  try { res.status(201).json(await service.create(Body.parse(req.body))); }
  catch (err) { next(err); }
});
```

## 4. End every artifact with a checklist

A short, verifiable checklist at the end of a rule, skill, or agent gives Claude a
self-check before it declares done. Keep items concrete ("No `any` at the boundary"),
not aspirational ("Write good code").

## 5. Progressive disclosure with `references/`

Keep the main file (`SKILL.md`, the agent body) focused and skimmable. Push bulky
material — templates, per-tool tables, long checklists — into a `references/`
subdirectory and link to it from the body. Those files load **only when the artifact
decides it needs them**, so depth is free until used.

- Skills: `references/` lives inside the skill directory (auto-discovered).
- Subagents: `.claude/agents/` is scanned **recursively for agent files**, so do **not**
  put reference docs under it. Put them in a neutral dir like `.claude/references/` and
  have the agent `Read` them by path. (This repo does exactly that for
  `security-checklist.md` and `orm-detection.md`.)

## 6. Conciseness is a feature

Once a skill or rule is in context, it stays there across turns — every line is a
recurring token cost. State *what* to do, not a narrated *why*. Apply the same test you'd
apply to CLAUDE.md: would a senior engineer need this sentence? If not, cut it.

## 7. Portability

Reference bundled files with placeholders, never absolute paths:

- `${CLAUDE_PROJECT_DIR}` — project root (hooks, skill bash blocks).
- `${CLAUDE_SKILL_DIR}` — the skill's own directory.
- `${CLAUDE_PLUGIN_ROOT}` — a plugin's root.

This repo's pack contains zero absolute paths, so `cp -r .claude/ <project>/` just works.

## 8. Don't hardcode the toolchain

If your artifacts run commands, detect the package manager and test runner at runtime
rather than assuming `npm`/`vitest`. This repo centralizes that in
[`.claude/lib/detect-toolchain.sh`](../.claude/lib/detect-toolchain.sh) and routes every
runner call through it — see how the skills and hooks source it.
