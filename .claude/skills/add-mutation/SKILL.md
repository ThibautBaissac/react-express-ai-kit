---
name: add-mutation
description: "Add a TanStack Query mutation hook for a feature write path with correct cache invalidation and optional optimistic update, keeping server state owned by Query and out of Zustand."
when_to_use: "Use WHEN adding a create/update/delete or other server write, wiring an action to a server change, or needing cache invalidation or optimistic updates — including when an implementation agent realizes such a To-Do item from a `tasks/task-N.md` plan, not only on direct user request. Do NOT use to define the API shape (use /add-api-contract first) or to build the form UI (use /scaffold-form)."
argument-hint: "[feature/action]"
arguments: [target]
model: sonnet
---

# Add a mutation hook

Wire `$target` as a TanStack Query mutation in its feature slice. The cache is
the single source of truth for server data — the mutation invalidates or updates
it, never copies it into Zustand.

## Step 1 — Locate the feature and its query keys

Find the owning feature, its request/response schema (from `/add-api-contract`),
the existing query-key factory, and the project API client (`shared/lib/api`).
Reuse the key factory; do not invent parallel keys.

## Step 2 — Define the mutation

Apply `references/mutation-patterns.md`.
- Type `mutationFn` input from the request schema (`z.infer`); parse the response
  before returning it.
- Call the API client; do not `fetch` inline.

## Step 3 — Keep the cache correct

Choose one:
- **Invalidate** (default): `onSuccess` → `queryClient.invalidateQueries` on the
  affected keys. Simple and correct.
- **Optimistic** (only when UX needs instant feedback): `onMutate` snapshots and
  writes the cache, `onError` rolls back to the snapshot, `onSettled`
  invalidates. Do not optimistically update without a rollback path.

## Step 4 — Surface state, don't duplicate it

Return `isPending`/`error` for callers to drive disabled states and messages.
Never mirror the mutated entity into a Zustand store — read it back from the
query cache.

## Step 5 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_tests <feature-hook-test>
```

Test with a fresh `QueryClient` and `retry: false`; assert the cache is
invalidated/updated and that an error rolls back any optimistic write.

## Checklist

- [ ] `mutationFn` input typed from the request schema; response parsed.
- [ ] Submission goes through the API client, not inline `fetch`.
- [ ] Affected query keys are invalidated, or optimistically updated with rollback.
- [ ] No server data mirrored into Zustand.
- [ ] Hook test uses a fresh `QueryClient` with `retry: false`; `run_typecheck` passes.
