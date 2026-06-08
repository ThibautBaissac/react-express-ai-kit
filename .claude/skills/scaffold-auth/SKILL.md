---
name: scaffold-auth
description: "Add authentication and server-side authorization to the Express API and React SPA: a users slice with password hashing, auth middleware that derives the principal server-side, ownership checks without existence leakage, and public DTOs that never leak secrets."
when_to_use: "Use WHEN adding signup/login/logout, protecting routes, gating UI by auth, password handling, sessions/JWT, or per-user ownership checks — including when an implementation agent realizes an auth-related To-Do item from a `tasks/task-N.md` plan, not only on direct user request. Do NOT use to wire a third-party OAuth provider wholesale, and use the schema-migration subagent for the users table definition and migration."
argument-hint: "[session|token]"
arguments: [strategy]
model: sonnet
---

# Scaffold authentication and authorization

Add auth as a `user` feature slice. `$strategy` is `session` (default for this
same-origin SPA + Express) or `token`. Authorization is enforced **server-side
from a server-derived principal** — never a client-supplied id.

## Step 1 — Detect toolchain and add minimal deps

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

Add only what is missing through the detected package manager:
- a password hasher (`argon2` or `bcrypt`);
- for `session`, the cookie/session middleware you will actually wire
  (`cookie-parser` for a signed cookie with an opaque server-side session id, or
  `cookie-session`/`express-session` if you choose a managed session store);
- for `token`, a JWT library.

Add an `AUTH_SESSION_SECRET` to the env schema in `src/shared/lib/env.ts` (a
name only — never hardcode a secret value). Session cookies must be signed,
`httpOnly`, same-site, and `secure` in production.

## Step 2 — Build the users slice

Apply `references/auth-patterns.md`. First delegate the users table definition
and migration to the schema-migration subagent. Then create under
`src/features/user/`:
- `user.schema.ts` — zod `UserSchema`, plus `PublicUser` that **omits** `passwordHash`/`salt`, and `SignupBody`/`LoginBody`.
- `user.repository.ts` — `findByEmail`, `findById`, `insert`; returns domain types.
- `user.service.ts` — hash on signup, verify on login (constant-time compare via the hasher), throw `UnauthorizedError` on bad credentials.

## Step 3 — Derive the principal server-side

Add auth middleware (in the slice, or `shared/lib` if truly cross-cutting) that
reads the session cookie / bearer token, resolves the user, and attaches a typed
`req.user`. Routes and services trust `req.user`, never `req.body`/`params` for
identity. Unauthenticated requests get `401`.

## Step 4 — Authorize and avoid existence leakage

Ownership checks compare a resource's owner to `req.user.id`. Where the specs
require hiding existence, return `404` (not `403`) for resources the principal
does not own. Keep this consistent with `/api-error-handling`.

## Step 5 — Wire the frontend

`useCurrentUser` query hook (`GET /api/auth/me`), `useLogin`/`useLogout`
mutations, and a React Router guard that redirects unauthenticated users. Server
auth state lives in TanStack Query — never mirror it into Zustand.

## Step 6 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_tests src/features/user
```

Prove the negative cases: wrong password, unauthenticated request (`401`), and a
foreign resource id (`404`/`403` per the existence-leakage decision).

## Checklist

- [ ] Passwords are hashed; plaintext is never stored, logged, or returned.
- [ ] `PublicUser` DTO omits `passwordHash`/`salt`/tokens; responses parse through it.
- [ ] Authorization uses the server-derived `req.user`, not client-supplied ids.
- [ ] Unauthenticated → `401`; foreign id handled per the existence-leakage decision.
- [ ] Auth state owned by TanStack Query; not mirrored into Zustand.
- [ ] Negative-case tests exist and pass; `run_typecheck` passes.
