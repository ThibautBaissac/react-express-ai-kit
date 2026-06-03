---
paths:
  - "**/services/**/*.ts"
  - "**/*.service.ts"
---

# Services — business logic only

The service holds the feature's rules and orchestration. It knows nothing about HTTP
or about the concrete data store.

## No HTTP leakage

Services take and return plain domain values — never `req`, `res`, or status codes.

```ts
// ❌ Express bleeding into the service
function create(req: Request, res: Response) { /* ... */ }

// ✅ pure domain signature
function create(input: CreateInvoiceBody): Promise<Invoice> { /* ... */ }
```

## Depend on a repository interface, not an implementation

Inject the repository so the service is testable and storage-agnostic.

```ts
export function createInvoiceService(repo: InvoiceRepository) {
  return {
    async create(input: CreateInvoiceBody): Promise<Invoice> {
      if (await repo.existsForPeriod(input.period)) {
        throw new ConflictError("Invoice already exists for period");
      }
      return repo.insert({ ...input, status: "draft" });
    },
  };
}
```

## Signal failure with typed domain errors

Throw domain errors (e.g. `NotFoundError`, `ConflictError`) or return a `Result` union.
Let the route/error middleware translate them to HTTP. Don't return HTTP status codes.

## Keep it cohesive (SRP)

One service per feature concern. If it starts coordinating unrelated concerns, split it.
Manual dependency injection (pass collaborators in) over a DI framework until one earns
its keep.

## Checklist
- [ ] No `req`/`res`/status codes in service signatures or bodies.
- [ ] Collaborators (repository, clients) injected, not imported as singletons.
- [ ] Depends on a repository **interface**, not a concrete ORM module.
- [ ] Failures expressed as domain errors / Result, not HTTP.
