---
name: scaffold-feature
description: >-
  Scaffold a new vertical-slice feature for a React + Express + TypeScript app:
  a shared zod contract, backend route → service → repository, frontend
  component → hook → store, and colocated tests, all wired through the layering.
when_to_use: >-
  Use WHEN the user asks to add/create a new feature, endpoint, resource, CRUD,
  or "vertical slice" (e.g. "add an invoices feature", "scaffold a users API").
  Use the `api` mode for backend-only, `ui` mode for frontend-only. Do NOT use
  for editing existing files, for one-off non-feature code, or for DB schema
  changes (use the schema-migration subagent for those).
argument-hint: "[feature-name] [full|api|ui]"
arguments: [feature, mode]
model: sonnet
---

# Scaffold a vertical-slice feature

Generate a cohesive feature slice that obeys the project's layering. Feature name:
`$feature` (kebab or camel; derive `PascalCase`, `camelCase`, and a plural as needed).
Mode: `$mode` (default `full`). `api` = backend only, `ui` = frontend only.

## Step 1 — Detect toolchain and layout (never assume)

```bash
bash "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

Then inspect the repo to learn the **existing** structure before creating files — read
`references/layout-detection.md` and follow it. Match the project's real conventions
(monorepo `apps/*`, `src/features/*`, `src/server`+`src/client`, etc.). Never impose a
layout the repo doesn't use.

## Step 2 — Confirm the plan

State the files you will create and where, given the detected layout and mode. If the
feature's fields/shape aren't specified, ask once or infer minimal sensible fields.

## Step 3 — Generate the slice (in dependency order)

Read `references/slice-templates.md` for the canonical templates and adapt them. Order:

1. **Shared contract** — `*.schema.ts`: zod schema + `z.infer` types + derived
   request/response shapes. (Skip in `ui`-only if a contract already exists; otherwise
   create it — both sides import it.)
2. **Backend** (`full`/`api`): `*.repository.ts` (interface + impl placeholder),
   `*.service.ts` (depends on the repo interface), `*.routes.ts` (thin, zod-parsed),
   and register the router.
3. **Frontend** (`full`/`ui`): `hooks/use<Feature>.ts` (TanStack Query),
   `store/<feature>.store.ts` (only if UI state is needed — YAGNI otherwise),
   `components/<Feature>List.tsx` + container.
4. **Tests** — colocated `*.service.test.ts` and a component test, per the project's
   detected runner.

## Step 4 — Verify

Run typecheck and the new tests through the detected toolchain:

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_tests <new-test-path>
```

Report what was created and any follow-ups (e.g. "fill in the repository impl for your
ORM" — consider the schema-migration subagent).

## Guardrails
- Respect the layering: routes parse + delegate; services hold logic; repositories hide
  the data store behind an interface; components stay presentational.
- One source of truth for shapes: the zod schema. No duplicate interfaces.
- Don't add a store, abstraction, or config the feature doesn't yet need (YAGNI).
- Use only the detected package manager / test runner — never hardcode npm/vitest.

## Checklist
- [ ] Toolchain + existing layout detected; files placed to match the repo.
- [ ] Shared zod schema is the single source of truth; types inferred.
- [ ] Backend layered route → service → repository(interface).
- [ ] Frontend layered component → hook(Query) → store(only if needed).
- [ ] Colocated tests created; typecheck + tests run green via detected runner.
