# Guide: Rules

Rules are markdown files that give Claude **always-true conventions** for your codebase.
Their superpower is **path scoping**: a rule can load into context only when Claude works with files that match a glob, so guidance is present exactly where it's relevant and absent everywhere else.

> See also: [conventions](./conventions.md) · [when to use what](./README.md#which-mechanism-do-i-use)

## When to use a rule

Use a rule when the guidance is:

- **A fact or standard, not a procedure.** "Handlers parse with zod then delegate" is a rule.
  "Here's how to scaffold a new feature" is a [skill](./skills.md).
- **Something Claude should follow without being asked.** Rules are advisory context that's always present for matching files — you don't invoke them.
- **Scoped to a file type or area.** Backend layering, React component style, test conventions.
  Path scoping keeps each rule out of context when it's irrelevant.

Use something else when:

- It must be **enforced** regardless of Claude's judgment → [hook](./hooks.md).
- It's a **multi-step task** or long reference → [skill](./skills.md).
- It only matters for **one delegated task** → [subagent](./subagents.md) system prompt.

## Where rules live

| Location | Scope |
| --- | --- |
| `.claude/rules/*.md` | Project (commit it; shared with the team) |
| `~/.claude/rules/*.md` | Personal, all your projects |

Files are discovered **recursively**, so you can nest them (`rules/backend/…`).
Symlinks are followed, so you can share a canonical rule set across repos.
Identity is just the file — there's no `name` field.

## Frontmatter: just `paths`

Rules have exactly one optional frontmatter field.

```markdown
---
paths:
  - "**/routes/**/*.ts"
  - "**/controllers/**/*.ts"
  - "**/*.{route,controller}.ts"
---

# Express routes — keep handlers thin
...
```

- **With `paths:`** — the rule loads only when Claude reads/edits a matching file.
- **Without `paths:`** — the rule loads **every session**, at the same priority as `CLAUDE.md`.
  Reserve this for the small set of always-relevant principles (this repo uses it once, for [`architecture.md`](../.claude/rules/architecture.md)).

`paths` accepts a glob list with brace expansion.
Patterns match against file paths:

| Pattern | Matches |
| --- | --- |
| `**/*.{ts,tsx}` | every TS/TSX file, any depth |
| `**/services/**/*.ts` | any file under any `services/` directory |
| `**/*.repository.ts` | files named `*.repository.ts` anywhere |
| `src/api/**/*` | everything under `src/api/` |

## Write globs by directory *convention*, not absolute layout

A rule keyed to `src/server/routes/**` breaks the moment someone uses `apps/api/` or a feature-folder layout.
Key on the **directory name** that signals the role, anywhere in the tree:

```yaml
# ❌ brittle — assumes one layout
paths: ["src/server/routes/**/*.ts"]

# ✅ survives src/, apps/api, feature folders, monorepos
paths:
  - "**/routes/**/*.ts"
  - "**/*.route.ts"
  - "**/*.routes.ts"
```

This is why every rule in this repo uses `**/<role>/**` plus `**/*.<role>.ts` patterns — they identify the layer by naming convention, so the pack works across project structures.

## Anatomy of a strong rule

Look at [`backend-routes.md`](../.claude/rules/backend-routes.md).
The pattern:

1. **One-line intent.** What this layer is responsible for, stated as a rule.
2. **A ✅/❌ pair.** The same handler done right and wrong — the highest-signal part.
3. **A short bullet list** of the specific do/don'ts.
4. **A closing checklist** Claude can self-verify against.

```markdown
---
paths: ["**/services/**/*.ts", "**/*.service.ts"]
---

# Services — business logic only

The service holds the feature's rules. It knows nothing about HTTP or the data store.

## No HTTP leakage
```ts
// ❌ Express bleeding into the service function create(req: Request, res: Response) { /* ... */ } // ✅ pure domain signature function create(input: CreateInvoiceBody): Promise<Invoice> { /* ... */ }
```

## Checklist
- [ ] No `req`/`res`/status codes in service signatures.
- [ ] Depends on a repository interface, not a concrete ORM.
```

## Keep them small

Target well under ~200 lines per rule; path scoping means many small rules beat one big one.
If a rule is growing branches and procedures, it's becoming a skill — split it.

If two rules contradict each other, Claude may pick one arbitrarily.
Review the set periodically and keep them consistent (especially nested rules and `CLAUDE.md`).

## Rules vs CLAUDE.md vs skills

| | CLAUDE.md | Rule | Skill |
| --- | --- | --- | --- |
| Loaded | Every session, in full | Every session (no `paths`) or on matching files | On demand only |
| Best for | Project-wide facts, build commands | File-type-scoped conventions | Procedures, long references |
| Cost | Always in context | Context only when relevant | ~Free until used |

A good split: `CLAUDE.md` holds the handful of universal facts; `.claude/rules/` holds the path-scoped conventions; skills hold the procedures.

## Checklist for a rule you're writing

- [ ] It's a convention/fact, not a procedure (else → skill) and not enforcement (else → hook).
- [ ] `paths:` uses directory-name conventions, not a hardcoded layout — or is intentionally always-on (no `paths`).
- [ ] Leads with intent; includes at least one ✅/❌ example.
- [ ] Under ~200 lines; no overlap/conflict with other rules.
- [ ] Ends with a concrete self-check checklist.
