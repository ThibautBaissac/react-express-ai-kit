---
paths:
  - "**/services/**/*.ts"
  - "**/*.service.ts"
---

# Services — business logic only

Services own feature rules and orchestration. They know neither HTTP nor the
concrete data store.

## Keep HTTP out

Take and return domain values. Never accept `req`, `res`, or HTTP status codes.

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

Throw typed domain errors such as `NotFoundError` or `ConflictError`, or return
a `Result` union. Route/error middleware translates failures to HTTP.

## Keep services cohesive

Use one service per feature concern. Split unrelated concerns. Prefer manual
dependency injection until a framework earns its cost.

## Checklist

- [ ] Service signatures contain no `req`, `res`, or HTTP status codes.
- [ ] Collaborators are injected.
- [ ] Services depend on repository interfaces.
- [ ] Services do not import concrete ORM modules.
- [ ] Failures are domain errors or Results.
