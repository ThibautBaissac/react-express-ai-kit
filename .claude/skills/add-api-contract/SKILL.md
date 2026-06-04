---
name: add-api-contract
description: "Create or extend the owning zod schema as the single source of truth for a FE/BE API shape, then wire backend parsing and a typed frontend call."
when_to_use: "Use WHEN adding or changing an API request shape, response shape, DTO, or React/Express boundary contract. Do NOT use for internal-only types or DB schema changes; use the schema-migration subagent for schema and migration work."
argument-hint: "[contract-name]"
arguments: [contract]
model: sonnet
---

# Add or extend an API contract

Define the shape once in zod, and import it from both sides.
Contract: `$contract`.

## Step 1 — Locate the owning feature

Find the owning feature and its existing contract location, using
`references/zod-patterns.md` section "Where it lives". Keep the contract in the
feature by default. Use an existing shared package or contracts directory only
when the contract is genuinely cross-feature.

## Step 2 — Define schema first

Read `references/zod-patterns.md` and apply it.
- Write a base `z.object` schema with real constraints such as uuid, int, min/max, and enum.
- Export types with `z.infer`; do not write a parallel interface.
- Derive request and response variants with `.pick`, `.omit`, `.partial`, or `.extend`.

## Step 3 — Wire the backend

Parse `req.body`, `req.params`, and `req.query` at the route boundary with the contract schema.
Follow any existing validation middleware pattern; otherwise parse inline and forward failures with `next(err)`.
Keep handlers thin: parse input, call the service, shape the response.

## Step 4 — Wire the frontend

Type request data from the derived schema type.
Parse API responses with the response schema before UI code trusts them.
Reuse the project's existing API client.

## Step 5 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
```

Confirm both sides import the same schema and no duplicate interface remains.

## Checklist

- [ ] Schema lives once in its owning feature, or in a shared module only when genuinely cross-feature.
- [ ] Types use `z.infer`, and variants are derived without copy-paste.
- [ ] Backend parses untrusted input at the boundary.
- [ ] Frontend parses responses and types requests from the schema.
- [ ] `run_typecheck` passes.
