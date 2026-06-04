---
paths:
  - "**/shared/**"
  - "**/common/**"
  - "**/core/**"
---

# The shared layer — cross-cutting infra only

`shared/` is the hybrid layout's home for code that is generic by nature and used
across features. It is first-class: stand up infrastructure here when first
needed. It is also narrow: domain logic never lives here.

This rule governs the whole `shared/` layer. The zod-contract subset of it is
covered in more detail by `shared-contracts.md`.

## What belongs in `shared/`

- **Infrastructure clients** — db client, http/fetch client, queue, cache.
- **Config and env** — parsed, typed configuration.
- **Logging and observability** — logger, metrics helpers.
- **Environment-neutral contracts** — cross-feature zod schemas (FE + BE).
- **Generic UI primitives** — `Button`, `Input`, `Dialog` wrappers: domain-free,
  driven entirely by props, no feature knowledge.
- **Generic utilities** — date/format/string helpers with no domain meaning.

## What does NOT belong in `shared/`

- **Domain logic** — anything that knows about invoices, users, orders, etc.
  That stays in its feature, even if a second feature would reuse it.
- **Feature components with domain props** — `InvoiceRow` is a feature
  component, not a shared primitive.
- **De-duplicated domain code** — do not move feature code into `shared/` to
  avoid duplication. Shared earns its place by being generic, not by being
  reused. Prefer duplication over leaking domain into `shared/`.

> Test: if you can't name what belongs here without naming a feature, it doesn't
> belong here.

## Dependency direction

`shared/` sits below every feature.

```
feature → shared        ✅
shared  → feature       ❌  never import a feature from shared
feature → feature       ❌  go through shared instead
```

Never import a feature module from `shared/`. If `shared/` seems to need
something from a feature, the dependency is backwards — the thing it needs is
either generic (move it down into `shared/`) or domain (keep it in the feature
and pass it in).

## Checklist

- [ ] Code here is generic — nameable without referring to any feature.
- [ ] No domain logic, no feature-specific components.
- [ ] No import of any feature module from `shared/`.
- [ ] Contracts here are environment-neutral (no Express/React/DB imports).
- [ ] Infra (clients, config, logger) is allowed up front, before a third use.
