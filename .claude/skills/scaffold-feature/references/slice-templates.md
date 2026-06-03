# Vertical-slice templates

Adapt these to the detected layout and naming. `Invoice` is the example feature; replace
with the real name. Keep generated code minimal — delete parts the feature doesn't need.

## 1. Shared contract — `invoice.schema.ts`

```ts
import { z } from "zod";

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  customer: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  status: z.enum(["draft", "sent", "paid"]),
  createdAt: z.string().datetime(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// Derived request/response shapes (don't redeclare).
export const CreateInvoiceBody = InvoiceSchema.pick({ customer: true, amountCents: true });
export type CreateInvoiceBody = z.infer<typeof CreateInvoiceBody>;

export const InvoiceListResponse = z.object({ items: z.array(InvoiceSchema) });
export type InvoiceListResponse = z.infer<typeof InvoiceListResponse>;
```

## 2. Repository — `invoice.repository.ts` (ORM-agnostic)

```ts
import type { Invoice, CreateInvoiceBody } from "../shared/invoice.schema";

export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  list(): Promise<Invoice[]>;
  insert(data: CreateInvoiceBody): Promise<Invoice>;
}

// Implementation behind the interface. Replace the body with your ORM/driver and map
// rows to domain types (parse with InvoiceSchema to guard drift). See the
// schema-migration subagent to wire up the actual data store.
export function createInvoiceRepository(/* db */): InvoiceRepository {
  return {
    async findById(_id) { throw new Error("not implemented"); },
    async list() { throw new Error("not implemented"); },
    async insert(_data) { throw new Error("not implemented"); },
  };
}
```

## 3. Service — `invoice.service.ts`

```ts
import type { InvoiceRepository } from "./invoice.repository";
import type { CreateInvoiceBody, Invoice } from "../shared/invoice.schema";

export class NotFoundError extends Error {}

export function createInvoiceService(repo: InvoiceRepository) {
  return {
    list: (): Promise<Invoice[]> => repo.list(),
    async get(id: string): Promise<Invoice> {
      const found = await repo.findById(id);
      if (!found) throw new NotFoundError(`Invoice ${id} not found`);
      return found;
    },
    create: (input: CreateInvoiceBody): Promise<Invoice> => repo.insert(input),
  };
}
export type InvoiceService = ReturnType<typeof createInvoiceService>;
```

## 4. Routes — `invoice.routes.ts` (thin)

```ts
import { Router } from "express";
import { CreateInvoiceBody } from "../shared/invoice.schema";
import type { InvoiceService } from "./invoice.service";

export function invoiceRoutes(service: InvoiceService): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try { res.json({ items: await service.list() }); }
    catch (err) { next(err); }
  });

  router.post("/", async (req, res, next) => {
    try {
      const body = CreateInvoiceBody.parse(req.body);
      res.status(201).json(await service.create(body));
    } catch (err) { next(err); }
  });

  return router;
}
// Register where other routers mount, e.g. app.use("/api/invoices", invoiceRoutes(service)).
```

## 5. Hook — `hooks/useInvoices.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InvoiceListResponse, type CreateInvoiceBody } from "../shared/invoice.schema";
import { api } from "../lib/api"; // reuse the project's existing client

const keys = { all: ["invoices"] as const };

export function useInvoices() {
  return useQuery({
    queryKey: keys.all,
    queryFn: async () => InvoiceListResponse.parse(await api.get("/invoices")),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInvoiceBody) => api.post("/invoices", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
```

## 6. Store — `store/invoice.store.ts` (only if UI state is needed)

```ts
import { create } from "zustand";

type InvoiceUi = {
  selectedId: string | null;
  select: (id: string | null) => void;
};
export const useInvoiceUi = create<InvoiceUi>((set) => ({
  selectedId: null,
  select: (selectedId) => set({ selectedId }),
}));
```

## 7. Component — `components/InvoiceList.tsx`

```tsx
import type { Invoice } from "../shared/invoice.schema";

type InvoiceListProps = { invoices: Invoice[] };
export function InvoiceList({ invoices }: InvoiceListProps) {
  return (
    <table>
      <tbody>
        {invoices.map((inv) => (
          <tr key={inv.id}><td>{inv.customer}</td><td>{inv.amountCents}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
```

Container that supplies data (keeps the list presentational):

```tsx
import { useInvoices } from "../hooks/useInvoices";
import { InvoiceList } from "./InvoiceList";

export function InvoiceListContainer() {
  const { data, isLoading, isError } = useInvoices();
  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p>Failed to load invoices.</p>;
  return <InvoiceList invoices={data.items} />;
}
```

See the `write-tests` skill for the matching colocated tests.
