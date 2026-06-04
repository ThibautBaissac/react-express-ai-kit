---
paths:
  - "**/contracts/**/*.ts"
  - "**/schemas/**/*.ts"
  - "**/*.schema.ts"
---

# FE/BE API contracts

This rule covers feature-owned and cross-feature zod API/domain contracts.
`architecture.md` governs other `shared/` code.

These globs may match persistence schemas. Classify the file first; persistence
schemas stay behind repositories and follow the detected data tool.

Contracts are the single source of truth for FE/BE shapes. Both sides import
them; neither redeclares them.

## Define schema first

Define the zod schema, then infer the TypeScript type. No parallel `interface`.

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

Derive request and response shapes from the base schema. Do not repeat fields.

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
