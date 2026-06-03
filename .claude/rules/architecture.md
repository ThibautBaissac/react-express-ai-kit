# Architecture baseline

Always-on principles for React + Express + TypeScript.
Path-scoped rules add layer-specific details.

## Organize by feature

Group code by vertical slice, not by technical layer.
A feature owns its API, business logic, data access, UI, hooks, state, contracts, and tests.
Extract shared code only after a pattern proves stable across several features.

```
features/invoice/
  invoice.schema.ts      # shared zod contract (FE + BE)
  invoice.routes.ts      # thin HTTP handlers
  invoice.service.ts     # business logic
  invoice.repository.ts  # data access (ORM-agnostic interface + impl)
  invoice.service.test.ts
  components/InvoiceList.tsx
  hooks/useInvoices.ts
  store/invoice.store.ts
```

## Keep dependencies one-way

```
Backend:  route → service → repository → (data source)
Frontend: component → hook → store/query client → (API)
```

A layer depends only on the layer below it, through a typed interface when possible.
Do not skip or reverse layers.
Do not put DB calls in routes.
Do not pass `req` or `res` into services.

## Use the five disciplines

- **KISS** — Choose the simplest thing that works.
- **DRY** — Keep one source of truth per fact.
- **SRP** — Give each module and function one reason to change.
- **YAGNI** — Build only what a current requirement needs.
- **Parse, don't validate** — Convert untrusted input into typed values at the boundary, then trust the type.

## Avoid premature abstraction

Prefer duplication over the wrong abstraction.
Extract a helper or component only after the third real use makes the right shape clear.
Premature abstraction adds coupling that costs more than the duplication it removes.

## Prefer composition

Compose small functions and components.
Avoid deep prop drilling, inheritance trees, and config objects with many optional flags.

## Checklist

- [ ] New code lives in its feature slice.
- [ ] Dependencies flow one way through typed interfaces.
- [ ] Routes do not call the DB.
- [ ] Services do not receive Express objects.
- [ ] Untrusted input is parsed at the boundary.
- [ ] No abstraction was added before a third real use.
