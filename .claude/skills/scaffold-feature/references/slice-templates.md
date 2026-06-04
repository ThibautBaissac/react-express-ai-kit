# Feature-slice templates

Adapt to detected layout and naming. Replace example `Invoice`; delete unneeded
parts. In a hybrid layout, these files stay in the feature, not `shared/`.

## 1. Contract — `invoice.schema.ts`

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

// Derived request/response shapes; do not redeclare fields.
export const CreateInvoiceBody = InvoiceSchema.pick({ customer: true, amountCents: true });
export type CreateInvoiceBody = z.infer<typeof CreateInvoiceBody>;

export const InvoiceListResponse = z.object({ items: z.array(InvoiceSchema) });
export type InvoiceListResponse = z.infer<typeof InvoiceListResponse>;
```

## 2. Repository — `invoice.repository.ts`

```ts
import type { Invoice, CreateInvoiceBody } from "./invoice.schema";

export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  list(): Promise<Invoice[]>;
  insert(data: CreateInvoiceBody): Promise<Invoice>;
}

// Replace these bodies with the repo's ORM or driver, then parse rows with InvoiceSchema to guard drift.
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
import type { CreateInvoiceBody, Invoice } from "./invoice.schema";

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

## 4. Routes — `invoice.routes.ts`

```ts
import { Router } from "express";
import { CreateInvoiceBody } from "./invoice.schema";
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
// Register where existing routers mount, such as app.use("/api/invoices", invoiceRoutes(service)).
```

## 5. Hook — `hooks/useInvoices.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InvoiceListResponse, type CreateInvoiceBody } from "../invoice.schema";
import { api } from "../../../lib/api"; // adapt to the project's existing client

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

## 6. Store — `store/invoice.store.ts`

Create this only when UI state is needed.

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
import type { Invoice } from "../invoice.schema";

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

The container supplies data; the list stays presentational.

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

## 8. Service test — `invoice.service.test.ts`

```ts
import { describe, expect, it, vi } from "vitest"; // adapt to the detected runner
import type { InvoiceRepository } from "./invoice.repository";
import { createInvoiceService, NotFoundError } from "./invoice.service";

const invoice = {
  id: "11111111-1111-4111-8111-111111111111",
  customer: "Acme",
  amountCents: 100,
  status: "draft" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function makeRepo(overrides: Partial<InvoiceRepository> = {}): InvoiceRepository {
  return {
    findById: vi.fn(),
    list: vi.fn(),
    insert: vi.fn(),
    ...overrides,
  };
}

describe("invoice service", () => {
  it("returns an invoice when found", async () => {
    const service = createInvoiceService(
      makeRepo({ findById: vi.fn().mockResolvedValue(invoice) }),
    );

    await expect(service.get(invoice.id)).resolves.toEqual(invoice);
  });

  it("throws when an invoice is missing", async () => {
    const service = createInvoiceService(
      makeRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );

    await expect(service.get("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

## 9. Component test — `components/InvoiceList.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest"; // adapt to the detected runner
import { InvoiceList } from "./InvoiceList";

it("renders an invoice row", () => {
  render(
    <InvoiceList
      invoices={[
        {
          id: "11111111-1111-4111-8111-111111111111",
          customer: "Acme",
          amountCents: 100,
          status: "draft",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]}
    />,
  );

  expect(screen.getByText("Acme")).toBeInTheDocument();
});
```

Adapt tests to the detected runner and existing setup.
