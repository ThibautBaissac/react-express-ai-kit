---
paths:
  - "**/*.{test,spec}.{ts,tsx}"
---

# Testing conventions

Runner-agnostic (Vitest or Jest — both expose `describe/it/expect`). Test files sit
next to the code they cover.

## Test behavior, not implementation

Assert on observable outcomes (return values, rendered output, calls to a mocked
boundary), not private internals.

```ts
// ❌ couples the test to internal structure
expect(service._cache.size).toBe(1);
// ✅ asserts behavior
expect(await service.getInvoice("id")).toEqual(invoice);
```

## Arrange–Act–Assert

Keep the three phases visible; one logical behavior per test.

## Services: mock the repository interface

A service depends on a repository interface — inject a fake/mock in tests, no real DB.

```ts
const repo: InvoiceRepository = { findById: vi.fn().mockResolvedValue(invoice) };
const service = createInvoiceService(repo);
```

## Components: React Testing Library, user-centric queries

Query by role/label/text as a user would; avoid test-id unless nothing else fits.

```tsx
// ✅
render(<InvoiceList invoices={[invoice]} />);
expect(screen.getByRole("row", { name: /acme/i })).toBeInTheDocument();
```

## Anything using TanStack Query: fresh client, retries off

```tsx
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
```

Use MSW to mock HTTP rather than stubbing `fetch` ad hoc.

## Checklist
- [ ] Test file colocated with the unit under test.
- [ ] Assertions target behavior, not private state.
- [ ] Services tested against a mocked repository interface.
- [ ] Components queried by role/label/text, not test-id.
- [ ] Query-backed components use a fresh client with `retry: false`.
