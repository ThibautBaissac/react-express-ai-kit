---
paths:
  - "**/services/**/*.ts"
  - "**/*.service.ts"
---

# Services — business logic only

The service owns feature rules and orchestration.
It knows nothing about HTTP.
It knows nothing about the concrete data store.

## Keep HTTP out

Services take and return plain domain values.
Never accept `req`, `res`, or HTTP status codes.

```ts
// ❌ Express bleeding into the service
function create(req: Request, res: Response) { /* ... */ }

// ✅ pure domain signature
function create(input: CreateInvoiceBody): Promise<Invoice> { /* ... */ }
```

## Depend on repository interfaces

Inject the repository so the service stays testable and storage-agnostic.

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

## Signal failures as domain failures

Throw typed domain errors such as `NotFoundError` or `ConflictError`, or return a `Result` union.
Let route or error middleware translate failures to HTTP.
Do not return HTTP status codes.

## Keep services cohesive

Use one service per feature concern.
Split a service when it starts coordinating unrelated concerns.
Use manual dependency injection until a DI framework earns its cost.

## Checklist

- [ ] Service signatures contain no `req`, `res`, or HTTP status codes.
- [ ] Collaborators are injected.
- [ ] Services depend on repository interfaces.
- [ ] Services do not import concrete ORM modules.
- [ ] Failures are domain errors or Results.
