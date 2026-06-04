---
paths:
  - "**/repositories/**/*.ts"
  - "**/repository/**/*.ts"
  - "**/*.repository.ts"
---

# Repositories — data-access boundary

Only repositories access the data store. Expose small domain interfaces; hide
the ORM or driver.

## Define domain interfaces

```ts
// ✅ storage-agnostic contract the service depends on
export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  insert(data: NewInvoice): Promise<Invoice>;
  existsForPeriod(period: string): Promise<boolean>;
}
```

Keep the detected data tool inside the concrete implementation.

## Return domain types

Map persistence rows to domain types at this boundary.

```ts
// ✅ map at the edge
async findById(id: string): Promise<Invoice | null> {
  const row = await db.invoice.findUnique({ where: { id } });
  return row ? InvoiceSchema.parse(row) : null; // also guards drift
}
```

```ts
// ❌ leaking the ORM entity and lazy relations
async findById(id: string) { return db.invoice.findUnique({ where: { id } }); }
```

## Keep business rules out

Repositories fetch and persist. Services make business decisions. Keep methods
thin and intent-named.

## Checklist

- [ ] Services depend on a repository interface.
- [ ] ORM or driver types stay inside the implementation.
- [ ] Methods return domain types.
- [ ] Rows are mapped or parsed at the repository edge.
- [ ] Business decisions stay out of repositories.
