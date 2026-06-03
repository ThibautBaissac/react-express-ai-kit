---
paths:
  - "**/repositories/**/*.ts"
  - "**/repository/**/*.ts"
  - "**/*.repository.ts"
---

# Repositories — the data-access boundary (ORM-agnostic)

The repository is the only place that talks to the data store. It exposes a small,
intention-revealing interface in **domain terms** and hides the ORM/driver entirely.

## Define the interface in domain language

```ts
// ✅ storage-agnostic contract the service depends on
export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  insert(data: NewInvoice): Promise<Invoice>;
  existsForPeriod(period: string): Promise<boolean>;
}
```

The concrete implementation (Prisma, Drizzle, Mongoose, Knex, raw SQL — whatever the
project uses) lives behind this interface and is swappable.

## Return domain types, not ORM rows

Map persistence shapes to domain types at this boundary so ORM details never leak upward.

```ts
// ✅ map at the edge
async findById(id: string): Promise<Invoice | null> {
  const row = await db.invoice.findUnique({ where: { id } });
  return row ? InvoiceSchema.parse(row) : null; // also guards drift
}
```

```ts
// ❌ leaking the ORM entity (and its lazy relations) to callers
async findById(id: string) { return db.invoice.findUnique({ where: { id } }); }
```

## No business rules here

Repositories fetch and persist. Decisions ("can this invoice be sent?") belong in the
service. Keep methods thin and named for intent, not for SQL.

## Checklist
- [ ] Service depends on an interface; the ORM is referenced only in the impl.
- [ ] Methods return domain types, mapped from persistence rows.
- [ ] No business decisions in repository methods.
- [ ] No ORM types in the interface signature.
