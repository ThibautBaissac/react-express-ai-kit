---
name: api-error-handling
description: "Extend the kit's central Express error handler and typed error contract end to end: domain errors carrying a statusCode, ZodError→400 at the boundary, 500s that never leak internals, and frontend mapping of ApiError into user-facing states."
when_to_use: "Use WHEN adding error handling for a route or service, defining domain errors (not found / unauthorized / forbidden / conflict), shaping API error responses, or mapping backend failures into UI — including when an implementation agent realizes such a To-Do item from a `tasks/task-N.md` plan, not only on direct user request. Do NOT use to define success contracts (use /add-api-contract) or to style error presentation (use /style-component)."
argument-hint: "[feature]"
arguments: [feature]
model: sonnet
---

# Error handling, end to end

Build on what the kit already ships — do not invent a new error envelope:
- `src/apiApp.ts` has one central `errorHandler`: `ZodError → 400`, otherwise it
  reads `err.statusCode` and hides the message on `5xx`.
- `src/shared/lib/api.ts` throws `ApiError(statusCode, body)` on a non-OK fetch.

Your job is to feed that handler typed domain errors and map `ApiError` in the UI.

## Step 1 — Define domain errors that carry a statusCode

Apply `references/error-patterns.md`. Add small error classes with a numeric
`statusCode` so the central handler maps them automatically: `NotFoundError`
(404), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409).
Put generic ones in `shared/lib/errors.ts`; keep feature-specific ones in the slice.

## Step 2 — Throw from services, catch in routes

Services throw domain errors; they never touch `req`/`res`. Routes `try/catch`
and forward with `next(err)` — never build ad-hoc error responses. The central
handler owns status and body shaping.

## Step 3 — Parse at the boundary

Keep parsing `req.body`/`params`/`query` with zod at the route. A failed
`.parse()` throws `ZodError`, which the central handler already turns into a
`400` with `issues` — no extra code needed.

## Step 4 — Don't leak existence or internals

- Where ownership matters, throw `NotFoundError` for resources the principal does
  not own (coordinate with `/scaffold-auth`).
- Never put secrets, stack traces, or raw DB errors in a response. The handler
  already masks `5xx` messages — keep `statusCode` off internal errors so they
  stay `500`.

## Step 5 — Map ApiError in the frontend

The query/mutation hook lets `ApiError` propagate; the component maps
`error.statusCode` to a user-facing message (401 → sign in, 404 → not found,
5xx → generic). Never render `error.body` raw. Pair with route `ErrorBoundary`
from `/react-router` for thrown render-time errors.

## Step 6 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_tests <feature>
```

Prove the codes: a route test asserting `400` (invalid body), `401`/`404` where
relevant, and that a thrown `5xx` response body contains no internal detail.

## Checklist

- [ ] Domain errors carry a numeric `statusCode`; the central handler maps them.
- [ ] Services throw; routes `next(err)`; no ad-hoc error responses or `req`/`res` in services.
- [ ] Boundary parsing stays at the route; `ZodError → 400` via the central handler.
- [ ] No secrets/stack traces in responses; `5xx` messages stay masked.
- [ ] Frontend maps `ApiError.statusCode` to messages; never renders raw bodies.
- [ ] Status-code tests pass; `run_typecheck` passes.
