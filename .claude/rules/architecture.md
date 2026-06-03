# Architecture baseline

Always-on principles for this React + Express + TypeScript codebase. Path-scoped
rules build on these.

## Organize by feature, not by layer

Group code by what it does (a vertical slice), not by technical kind. A feature owns
its slice end to end; shared code is extracted only once a pattern has proven stable
across several features.

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

## Layer dependencies point one way

```
Backend:  route → service → repository → (data source)
Frontend: component → hook → store/query client → (API)
```

A layer may depend only on the layer below it through a typed interface. Never skip
or reverse a layer (no DB calls in a route, no `req`/`res` in a service).

## The five disciplines

- **KISS** — the simplest thing that works. No speculative configurability.
- **DRY** — one source of truth per fact. The zod schema is that source for shapes.
- **SRP** — one reason to change per module/function.
- **YAGNI** — build only what a current requirement needs.
- **Parse, don't validate** — convert untrusted input into typed values at the boundary
  (zod `.parse`), then trust the type inside.

## Don't abstract until it earns it

Prefer duplication over the wrong abstraction. Extract a shared helper/component only
after the third concrete use makes the right shape obvious. Premature abstraction adds
coupling that is costlier to remove than the duplication it replaced.

## Composition over inheritance/config

Compose small functions and components. Avoid deep prop drilling and "god" objects with
many optional flags.

## Checklist
- [ ] New code lives in its feature slice, not a global `utils` dump.
- [ ] Dependencies flow one direction through typed interfaces.
- [ ] No layer-skipping (DB in routes, Express in services).
- [ ] Untrusted input is parsed into types at the boundary.
- [ ] No abstraction introduced before a third real use.
