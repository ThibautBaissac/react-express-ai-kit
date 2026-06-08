---
name: scaffold-seed
description: "Author idempotent Drizzle seed data in scripts/seed.ts that supports demos, security proofs, and empty/edge states, with inputs parsed through feature zod schemas."
when_to_use: "Use WHEN adding or updating seed/fixture/demo data, or when an implementation agent realizes a To-Do item that needs seeded records for a demo, a security proof, or an empty-state — not only on direct user request. Do NOT use to create or alter tables (use the schema-migration subagent) or to write tests (use /write-tests)."
argument-hint: "[feature]"
arguments: [feature]
model: sonnet
---

# Scaffold seed data

Populate the dev/demo database for `$feature` (or all features) so flows,
security boundaries, and empty states are demonstrable. The kit wires
`db:seed` → `tsx scripts/seed.ts`.

## Step 1 — Detect toolchain and locate the entry

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

Open `scripts/seed.ts` if it exists; create it if not. Import `db` from
`src/shared/lib/db` and the feature `*.table.ts` definitions. Never reach into
the database directly from anywhere else.

## Step 2 — Make it idempotent

`db:seed` must be safe to run repeatedly — the implementation/review pipeline
re-runs it to check idempotency. Use a clear-then-insert or upsert/`onConflict`
strategy so two runs yield the same rows, never duplicates or drift. Apply
`references/seed-patterns.md`.

## Step 3 — Seed for proof, not just the happy path

Cover what later verification needs:
- the **demo happy path** (enough rows to render the main flow);
- **security proofs** — e.g. two owners holding different resources, so an
  ownership/authorization test has foreign data to hit;
- **an empty/edge case** — leave one entity with no children so empty-state UI
  can be demonstrated.

## Step 4 — Parse before insert

Validate constructed records through the feature zod schema (or a derived insert
shape) before writing, so seed data cannot drift from the contract.

## Step 5 — Report counts

Log inserted/updated counts per table on completion. The pipeline records this
one-line snippet as proof the seed ran.

## Step 6 — Verify idempotency

Run the full sequence in one chained invocation so state is never lost:

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
pm_run db:migrate && pm_run db:seed && pm_run db:seed
```

The second `db:seed` must print the same counts as the first. Capture that
output for the task doc.

## Checklist

- [ ] `scripts/seed.ts` imports `db` and feature `*.table.ts`; no ad-hoc DB access.
- [ ] Re-running `db:seed` is idempotent (same counts, no duplicates).
- [ ] Seed includes happy-path, a security-proof pair, and an empty-state case.
- [ ] Records are parsed through the feature zod schema before insert.
- [ ] Counts are logged; the idempotency run is captured.
