---
paths:
  - "**/shared/**/*.ts"
  - "**/contracts/**/*.ts"
  - "**/schemas/**/*.ts"
  - "**/*.schema.ts"
---

# Shared API contracts (zod)

These files are the single source of truth for data shapes crossing the FE/BE boundary.
Both sides import them — never redeclare a shape on one side.

## Schema first, type derived

Define the zod schema, then infer the TypeScript type. Don't hand-write a parallel
`interface`.

```ts
// ✅ one source of truth
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  amountCents: z.number().int().nonnegative(),
  status: z.enum(["draft", "sent", "paid"]),
});
export type Invoice = z.infer<typeof InvoiceSchema>;
```

```ts
// ❌ duplicate that will drift from the schema
export interface Invoice { id: string; amountCents: number; status: string; }
```

## Derive request/response shapes — don't repeat

```ts
export const CreateInvoiceBody = InvoiceSchema.omit({ id: true, status: true });
export type CreateInvoiceBody = z.infer<typeof CreateInvoiceBody>;

export const InvoiceListResponse = z.object({ items: z.array(InvoiceSchema) });
```

Use `.pick()`, `.omit()`, `.partial()`, `.extend()` to derive variants from the base.

## Keep this layer environment-neutral

No Express, no React, no DB-client imports here. These modules must be importable by
both the browser bundle and Node without pulling in server- or client-only deps.

## Stable, versioned, additive

Treat published shapes like an API. Prefer additive changes; make breaking changes
explicit (e.g. `InvoiceV2Schema`).

## Checklist
- [ ] Type is `z.infer` of the schema, not a separate interface.
- [ ] Variants derived with pick/omit/partial/extend, not copy-paste.
- [ ] No server- or client-only imports in this module.
- [ ] Field constraints (uuid, int, min/max, enum) encoded in the schema.
