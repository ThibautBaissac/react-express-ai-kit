---
name: scaffold-feature
description: "Scaffold a vertical-slice React + Express + TypeScript feature with a FE/BE zod contract, backend route → service → repository, frontend Query hooks and optional UI state, and colocated tests."
when_to_use: "Use WHEN the user asks to add a feature, endpoint, resource, CRUD flow, or vertical slice. Use `api` for backend-only work and `ui` for frontend-only work. Do NOT use for one-off edits or DB schema changes; use the schema-migration subagent for schema work."
argument-hint: "[feature-name] [full|api|ui]"
arguments: [feature, mode]
model: sonnet
---

# Scaffold a vertical-slice feature

Generate `$feature` as one cohesive slice matching the repo. Mode: `$mode` or `full`.

## Step 1 — Detect toolchain and layout

```bash
bash "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

Inspect before creating files. Apply `references/layout-detection.md`. Match
existing layout, naming, exports, router registration, and API clients.

## Step 2 — Confirm the plan

State files and locations. If fields are missing, ask once or infer the smallest useful shape.

## Step 3 — Generate the slice

Adapt `references/slice-templates.md` to the detected layout.

1. **Contract** — Create `*.schema.ts` with a zod schema, `z.infer` types, and derived request/response shapes. Keep it in the feature; place it in the shared contracts dir only if the shape is genuinely cross-feature.
2. **Backend** — For `full` or `api`, create `*.repository.ts`, `*.service.ts`, and `*.routes.ts`, then register the router where existing routers mount.
3. **Frontend** — For `full` or `ui`, create a TanStack Query hook, presentational components, and a store only when UI state needs one.
4. **Tests** — Add colocated service and component tests using the detected runner and existing test style.

## Step 4 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_tests <new-test-path>
```

Report created files, verification, and required follow-ups.

## Guardrails

- Routes parse input and delegate to services.
- Services hold business logic and depend on repository interfaces.
- Repositories hide the data store and return domain types.
- Components stay presentational.
- TanStack Query owns server state.
- Stores hold UI state only when needed.
- Zod schemas are the single source of truth for FE/BE shapes.
- Domain code goes in the feature slice; keep domain logic out of `shared/` (cross-cutting infra only).
- Do not add abstractions, stores, config, or framework changes before they earn it.
- Route every runner call through `detect-toolchain.sh`.

## Checklist

- [ ] Toolchain and layout were detected.
- [ ] Files match the repo's existing structure.
- [ ] The FE/BE zod contract is the single source of truth.
- [ ] Backend layers are route → service → repository interface.
- [ ] Frontend server state flows component → hook → Query/API; stores hold UI state only when needed.
- [ ] Colocated tests exist and pass through the detected runner.
