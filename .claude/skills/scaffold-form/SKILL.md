---
name: scaffold-form
description: "Scaffold a React Hook Form wired to the feature's zod request contract via zodResolver, submitting through a TanStack Query mutation hook, with accessible fields and surfaced errors."
when_to_use: "Use WHEN adding or changing a create/edit form, input form, or form component in the React SPA — whether the user asks directly or an implementation agent is realizing a matching To-Do item from a `tasks/task-N.md` plan. Do NOT use to define the API shape (use /add-api-contract first) or to style presentation only (use /style-component)."
argument-hint: "[form-name]"
arguments: [form]
model: sonnet
---

# Scaffold a form

Build `$form` with React Hook Form validated against the feature's existing zod
request contract. The form owns input state; a mutation hook owns submission.

## Step 1 — Locate the contract and feature

Find the owning feature and its request schema (`CreateXBody`, `UpdateXBody`). If
no contract exists yet, stop and run `/add-api-contract` first — the form
validates against that schema, it does not define one.

## Step 2 — Ensure dependencies

Check for `react-hook-form` and `@hookform/resolvers`. Install only what is
missing through the detected package manager. Reuse the project's existing field
primitives in `shared/ui` (`Field`, `Input`, `FormError`) before adding new ones.

## Step 3 — Build the form

Apply `references/form-patterns.md`.
- Type `useForm` as `z.infer` of the request schema; resolve with
  `zodResolver(<RequestBody>)`.
- Derive `defaultValues` from typed data (edit) or schema-shaped literals (create).
- Register inputs against schema field names; render `formState.errors` tied to
  inputs with `aria-invalid` / `aria-describedby`.

## Step 4 — Wire submission through a mutation

Call the feature's TanStack Query mutation hook (`useCreateX` / `useUpdateX`); do
not `fetch` in the component. Disable submit with the mutation's `isPending`. Map
server failures back onto fields with `setError`, or to a form-level message.

## Step 5 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_tests
```

Confirm the resolver schema is the same one the API parses, and no parallel form
schema or `interface` was introduced.

## Checklist

- [ ] Resolver uses the feature's existing zod request schema; values are its `z.infer`.
- [ ] No second form schema or parallel `interface`.
- [ ] Submission goes through a `useMutation` hook; no `fetch`/invalidation in the form.
- [ ] Submit disabled via `isPending`; field and server errors surfaced accessibly.
- [ ] Generic field primitives live in `shared/ui`; the domain form stays in its feature.
- [ ] `run_typecheck` and `run_tests` pass.
