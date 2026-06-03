---
name: add-api-contract
description: >-
  Create or extend a shared zod schema that is the single source of truth for a
  data shape crossing the FE/BE boundary, then wire it into backend validation
  and a typed frontend client call.
when_to_use: >-
  Use WHEN adding or changing an API request/response shape, a DTO, or any data
  contract shared between the Express backend and the React frontend (e.g. "add
  a field to the user payload", "define the search request schema", "type this
  endpoint's response"). Do NOT use for internal-only types that never cross the
  boundary, or for DB schema/migrations (use the schema-migration subagent).
argument-hint: "[contract-name]"
arguments: [contract]
model: sonnet
---

# Add or extend a shared API contract

Define the shape once in zod; both sides import it. Contract: `$contract`.

## Step 1 — Locate the shared module

Find where shared schemas live (see `references/zod-patterns.md` → "Where it lives").
In a monorepo it's the shared package; otherwise an environment-neutral dir
(`src/shared`, `src/contracts`) importable by FE and BE. Reuse the existing location.

## Step 2 — Define schema first, derive types and variants

Read `references/zod-patterns.md` and apply it:
- Write the base `z.object` schema with real constraints (uuid, int, min/max, enum).
- `export type X = z.infer<typeof XSchema>` — never a hand-written parallel interface.
- Derive request/response variants with `.pick/.omit/.partial/.extend` instead of
  copy-pasting fields.

## Step 3 — Wire the backend (parse at the boundary)

In the route/controller, replace any raw `req.body` access with `Schema.parse(...)`.
If a validation middleware pattern already exists, follow it; otherwise parse inline and
forward failures via `next(err)`.

## Step 4 — Wire the frontend (typed client + parse the response)

In the calling hook/service, type the request with the derived body type and parse the
response with the response schema so the UI trusts typed data.

## Step 5 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
```

Confirm both sides import the same schema and no duplicate interface remains.

## Checklist
- [ ] Schema defined once in the shared, environment-neutral module.
- [ ] Type is `z.infer`; variants derived (no copy-paste, no duplicate interface).
- [ ] Backend parses input at the boundary with the schema.
- [ ] Frontend parses the response and types the request from the schema.
- [ ] `run_typecheck` passes on both sides.
