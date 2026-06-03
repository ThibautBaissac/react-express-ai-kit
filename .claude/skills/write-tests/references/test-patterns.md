# Test patterns (Vitest or Jest)

Both runners share `describe/it/expect`. The only differences are imports and the mock
factory (`vi` vs `jest`). Match whatever the project already uses.

```ts
// Vitest
import { describe, it, expect, vi } from "vitest";
// Jest (globals enabled) — no import; or:
import { describe, it, expect, jest } from "@jest/globals";
```

In examples below, define a local `mockFn` helper for the detected runner:

```ts
// Vitest
const mockFn = vi.fn;
// Jest
const mockFn = jest.fn;
```

## Service — mock the repository interface

```ts
import { createInvoiceService, NotFoundError } from "./invoice.service";
import type { InvoiceRepository } from "./invoice.repository";

const invoice = { id: "11111111-1111-1111-1111-111111111111", customer: "Acme",
  amountCents: 100, status: "draft", createdAt: new Date().toISOString() };

function makeRepo(over: Partial<InvoiceRepository> = {}): InvoiceRepository {
  return { findById: mockFn(), list: mockFn(), insert: mockFn(), ...over };
}

describe("invoiceService.get", () => {
  it("returns the invoice when found", async () => {
    const service = createInvoiceService(makeRepo({ findById: mockFn().mockResolvedValue(invoice) }));
    await expect(service.get(invoice.id)).resolves.toEqual(invoice);
  });

  it("throws NotFoundError when missing", async () => {
    const service = createInvoiceService(makeRepo({ findById: mockFn().mockResolvedValue(null) }));
    await expect(service.get("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

## Component — React Testing Library, user-centric queries

```tsx
import { render, screen } from "@testing-library/react";
import { InvoiceList } from "./InvoiceList";

it("renders a row per invoice", () => {
  render(<InvoiceList invoices={[invoice]} />);
  expect(screen.getByText("Acme")).toBeInTheDocument();
});
```

## Component/hook using TanStack Query — fresh client, retries off

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

function withClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

it("shows invoices once loaded", async () => {
  render(withClient(<InvoiceListContainer />));
  expect(await screen.findByText("Acme")).toBeInTheDocument();
});
```

## Mocking HTTP — prefer MSW over stubbing fetch

If the project uses MSW, define handlers in a shared `server` and `server.use(...)` per
test for error cases. Otherwise mock the project's API client module, not global `fetch`.

## Do / don't
- ✅ One behavior per test; descriptive names ("throws when missing").
- ✅ Cover an error/edge path, not only the happy path.
- ❌ Asserting private fields, call order that doesn't matter, or snapshotting large trees.
- ❌ Real network or real DB in unit tests.
