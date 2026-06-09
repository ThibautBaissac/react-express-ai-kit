---
paths:
  - "**/*.ability.ts"
  - "**/shared/authz/**/*.ts"
  - "**/shared/authz/**/*.tsx"
---

# Authorization with CASL

Covers permission rules (what a principal may do). Authentication (who the
principal is) lives in the auth slice; see `/scaffold-auth`. The base lives in
`src/shared/authz/` and is domain-free — never add a feature's rules there.

## One isomorphic source of truth

Each feature owns one `<feature>.ability.ts` exporting an `AbilityContributor`.
The server and the React bundle import the SAME file, so a permission is defined
once and the UI hides exactly what the API would reject.

```ts
// features/invoice/invoice.ability.ts
import type { AbilityContributor } from "../../shared/authz/ability";

export const invoiceAbilities: AbilityContributor = (can, _cannot, user) => {
  can("read", "Invoice");
  if (!user) return;
  can("create", "Invoice");
  can("update", "Invoice", { ownerId: user.id }); // per-record condition
  if (user.roles?.includes("admin")) can("manage", "all");
};
```

Ability files are environment-neutral like contracts: **no Express, React, DB,
or server/client-only imports.** They run in both bundles.

## The server enforces; the client only hides

- **Server is the security boundary.** Mount `attachAbility(getPrincipal, contributors)`
  after the auth middleware, then guard routes with `authorize(action, subject)`
  or pass `req.ability` into the service as an `AppAbility` and check
  `ability.can(action, subject(type, record))` there. Never pass `req`/`res` into
  services.
- **Client is UX only.** `<Can>` / `useAbility()` hide or disable UI. Never treat
  a passed `<Can>` as proof the action is allowed — the request is still
  authorized server-side.

## Build from the server-derived principal

Rules read the `Principal` (`{ id, roles? }`) derived server-side from the
session/token — never a client-supplied id from the body, params, or query.
This is the same parse-don't-validate boundary as everywhere else.

## Per-record checks need a tagged subject

Type-level checks take a string (`can("update", "Invoice")`). Per-record checks
must tag the record so CASL knows its type and can match conditions:

```ts
import { subject } from "../../shared/authz/ability";
ability.can("update", subject("Invoice", invoice)); // matches { ownerId }
```

Keep existence-leakage decisions (404 vs 403) with `/api-error-handling`: a
forbidden type-level action is 403 (`ForbiddenError`); a record the principal
must not know exists is 404.

## Compose from the root, never cross-import

The contributor list is assembled at the composition root (server middleware /
React `AbilityProvider`), so `shared/authz` never imports a feature and features
never import each other's ability files.

## Checklist

- [ ] One `<feature>.ability.ts` per feature; rules live there, not in `shared/`.
- [ ] Ability file has no Express/React/DB/server-only or client-only imports.
- [ ] Server enforces via `authorize` / `req.ability`; `<Can>` only hides UI.
- [ ] Rules read the server-derived `Principal`, never a client-supplied id.
- [ ] Per-record checks tag the record with `subject(type, record)`.
- [ ] Contributors composed at the root; no feature-to-feature ability imports.
