---
paths:
  - "**/contracts/**/*.ts"
  - "**/schemas/**/*.ts"
  - "**/*.schema.ts"
---

# FE/BE API contracts

This rule governs zod API or domain contracts, whether feature-owned or
cross-feature. The broader `shared/` layer — infra clients, config, UI
primitives — is governed by `architecture.md`.

The path globs can also match persistence or ORM schemas, such as Drizzle table
definitions. Classify the file before applying this rule; persistence schemas
stay behind the repository boundary and follow the detected data tool's
conventions.

These files are the single source of truth for FE/BE data shapes.
Both sides import them.
Never redeclare the same shape on one side.

## Define schema first

Define the zod schema, then infer the TypeScript type.
Do not hand-write a parallel `interface`.

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

## Derive variants

Derive request and response shapes from the base schema.
Do not repeat fields by hand.

```ts
export const CreateInvoiceBody = InvoiceSchema.omit({ id: true, status: true });
export type CreateInvoiceBody = z.infer<typeof CreateInvoiceBody>;

export const InvoiceListResponse = z.object({ items: z.array(InvoiceSchema) });
```

Use `.pick()`, `.omit()`, `.partial()`, and `.extend()` for variants.

## Keep contracts environment-neutral

Do not import Express, React, DB clients, or server/client-only modules.
Contracts must work in both the browser bundle and Node.

## Prefer additive changes

Treat published shapes like an API.
Prefer additive changes.
Make breaking changes explicit, such as `InvoiceV2Schema`.

## Checklist

- [ ] Type is `z.infer` of the schema.
- [ ] No parallel interface duplicates the schema.
- [ ] Variants are derived, not copy-pasted.
- [ ] Module has no server-only or client-only imports.
- [ ] Field constraints are encoded in zod.
