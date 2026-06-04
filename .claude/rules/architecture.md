# Architecture baseline

Always-on principles for React + Express + TypeScript.
Path-scoped rules add layer-specific details.

## Organize by feature, over a shared layer

This is a **hybrid** layout: feature slices for domain code, a `shared/` layer
for cross-cutting code.

A **feature** owns its domain API, business logic, data access, UI, hooks,
state, contracts, and tests. Domain code always lives in a feature.

The **`shared/` layer** holds cross-cutting infrastructure that several features
build on — the db/http clients, config, logger, environment-neutral zod
contracts, and generic UI primitives. It is a first-class home from the start,
not a reluctant afterthought. See `shared-layer.md` for what does and does not
belong there.

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

**Cross-cutting infra is allowed up front.** What stays earned is *domain*
abstraction: do not promote feature code into `shared/` for reuse — if two
features need the same domain logic, that is a design conversation, not a copy
into `shared/`. `shared/` is for things that are generic by nature, not for
de-duplicating domain code.

## Keep dependencies one-way

```
Backend:  route → service → repository → (data source)
Frontend: component → hook → store/query client → (API)
```

A layer depends only on the layer below it, through a typed interface when possible.
Do not skip or reverse layers.
Do not put DB calls in routes.
Do not pass `req` or `res` into services.

Dependencies across the hybrid layout flow one way too:

```
feature → shared        (allowed)
shared  → feature       (never — no back-dependency)
feature → feature       (never — go through shared)
```

A feature may import from `shared/`; `shared/` must never import from a feature,
and features must not import each other.

## Use the five disciplines

- **KISS** — Choose the simplest thing that works.
- **DRY** — Keep one source of truth per fact.
- **SRP** — Give each module and function one reason to change.
- **YAGNI** — Build only what a current requirement needs.
- **Parse, don't validate** — Convert untrusted input into typed values at the boundary, then trust the type.

## Avoid premature abstraction

Prefer duplication over the wrong abstraction.
Extract a *domain* helper or component only after the third real use makes the right shape clear.
Premature abstraction adds coupling that costs more than the duplication it removes.

This applies to domain code, not to cross-cutting infrastructure. The db client,
http client, logger, and config in `shared/` are foundational by nature — stand
them up when first needed rather than waiting for a third use.

## Prefer composition

Compose small functions and components.
Avoid deep prop drilling, inheritance trees, and config objects with many optional flags.

## Checklist

- [ ] New code lives in its feature slice, or in `shared/` only if it is genuinely cross-cutting infra.
- [ ] No domain logic leaked into `shared/`.
- [ ] `shared/` has no back-dependency on a feature; features do not import each other.
- [ ] Dependencies flow one way through typed interfaces.
- [ ] Routes do not call the DB.
- [ ] Services do not receive Express objects.
- [ ] Untrusted input is parsed at the boundary.
- [ ] No domain abstraction was added before a third real use.
