# Architecture baseline

Always-on React + Express + TypeScript principles. Path-scoped rules add layer details.

## Organize by feature, over a shared layer

Use a **hybrid** layout: feature slices own domain code; `shared/` owns
cross-cutting infrastructure.

A feature owns its API, business logic, data access, UI, hooks, state,
contracts, and tests. `shared/` holds db/http clients, config, logging,
environment-neutral cross-feature contracts, and generic UI primitives.

```
features/invoice/
  invoice.schema.ts      # zod contract for this feature (FE + BE)
  invoice.routes.ts      # thin HTTP handlers
  invoice.service.ts     # business logic
  invoice.repository.ts  # data access (ORM-agnostic interface + impl)
  invoice.service.test.ts
  components/InvoiceList.tsx
  hooks/useInvoices.ts
  store/invoice.store.ts

shared/
  ui/Button.tsx          # generic, domain-free UI primitives
  lib/db.ts              # db client, http client, logger, config
  contracts/             # cross-feature zod contracts (FE + BE)
```

### What belongs in `shared/`

- Infrastructure clients — db, http/fetch, queue, cache.
- Parsed config and environment values.
- Logging and observability.
- Environment-neutral cross-feature contracts.
- Generic, domain-free UI primitives and utilities.

### What does not belong in `shared/`

- Domain logic or feature components with domain props.
- Feature code moved only to avoid duplication.

If naming the code requires naming a feature, keep it in that feature.
Cross-cutting infra may enter `shared/` on first use.

## Keep dependencies one-way

```
Backend:  route → service → repository → (data source)
Frontend server state: component → hook → Query client → (API)
Frontend UI state:     component → hook/store
```

A layer depends only on the layer below, through typed interfaces where possible.
Never skip or reverse layers. No DB calls in routes. No `req` or `res` in services.

Dependencies across the hybrid layout flow one way too:

```
feature → shared        (allowed)
shared  → feature       (never — no back-dependency)
feature → feature       (avoid direct dependencies)
```

Features may import `shared/`; `shared/` never imports features. Avoid direct
feature imports. For cross-feature workflows, reconsider boundaries or
coordinate from a composition root. Do not move domain code into `shared/`.

## Use the five disciplines

- **KISS** — Choose the simplest thing that works.
- **DRY** — Keep one source of truth per fact.
- **SRP** — Give each module and function one reason to change.
- **YAGNI** — Build only what a current requirement needs.
- **Parse, don't validate** — Convert untrusted input into typed values at the boundary, then trust the type.

## Avoid premature abstraction

Prefer duplication over the wrong abstraction. Extract a *domain* helper or
component after its third real use reveals the right shape. Cross-cutting
infrastructure such as db/http clients, logging, and config may start on first use.

## Prefer composition

Compose small functions and components. Avoid deep prop drilling, inheritance
trees, and flag-heavy config objects.

## Checklist

- [ ] New code lives in its feature slice, or in `shared/` only if it is genuinely cross-cutting infra.
- [ ] No domain logic leaked into `shared/`.
- [ ] `shared/` has no back-dependency on a feature; direct feature dependencies are avoided.
- [ ] Dependencies flow one way through typed interfaces.
- [ ] Routes do not call the DB.
- [ ] Services do not receive Express objects.
- [ ] Untrusted input is parsed at the boundary.
- [ ] No domain abstraction was added before a third real use.
