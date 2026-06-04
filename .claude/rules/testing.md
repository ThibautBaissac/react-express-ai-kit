---
paths:
  - "**/*.{test,spec}.{ts,tsx}"
---

# Testing conventions

Vitest and Jest expose `describe`, `it`, and `expect`. Colocate tests.

## Test behavior

Assert observable outcomes, not private internals.

```ts
// ❌ couples the test to internal structure
expect(service._cache.size).toBe(1);
// ✅ asserts behavior
expect(await service.getInvoice("id")).toEqual(invoice);
```

## Use Arrange–Act–Assert

Keep setup, action, and assertion visible. Test one logical behavior per test.

## Mock repository interfaces

Service unit tests mock repository interfaces; they never use a real DB.

```ts
const mockFn = vi.fn; // or jest.fn in a Jest project
const repo: InvoiceRepository = { findById: mockFn().mockResolvedValue(invoice) };
const service = createInvoiceService(repo);
```

## Test components like users

Use React Testing Library queries by role, label, or text. Use test IDs only
when no user-facing query fits.

```tsx
// ✅
render(<InvoiceList invoices={[invoice]} />);
expect(screen.getByRole("row", { name: /acme/i })).toBeInTheDocument();
```

## Use fresh Query clients

Anything using TanStack Query gets a fresh client with retries off.

```tsx
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
```

Prefer MSW over ad hoc `fetch` stubs.

## Checklist

- [ ] Test file is colocated with the unit under test.
- [ ] Assertions target behavior.
- [ ] Services use mocked repository interfaces.
- [ ] Components query by role, label, or text.
- [ ] Query-backed components use a fresh client with `retry: false`.
