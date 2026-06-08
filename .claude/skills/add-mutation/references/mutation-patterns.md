# Mutation patterns

Adapt to the feature's existing keys, schema, and API client. Generic example
uses `invoice`.

## Query-key factory (reuse, don't reinvent)

```ts
export const invoiceKeys = {
  all: ["invoices"] as const,
  detail: (id: string) => ["invoices", id] as const,
};
```

## Invalidate (default — simple and correct)

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InvoiceSchema, type CreateInvoiceBody } from "../invoice.schema";
import { api } from "../../../shared/lib/api";
import { invoiceKeys } from "./keys";

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateInvoiceBody) =>
      InvoiceSchema.parse(await api.post("/invoices", { body })), // parse the response
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}
```

## Optimistic update (only when UX needs instant feedback)

```ts
export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateInvoiceBody) =>
      InvoiceSchema.parse(await api.patch(`/invoices/${id}`, { body })),

    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: invoiceKeys.detail(id) });
      const previous = qc.getQueryData(invoiceKeys.detail(id)); // snapshot for rollback
      qc.setQueryData(invoiceKeys.detail(id), (old) => ({ ...(old as object), ...body }));
      return { previous };
    },
    onError: (_err, _body, ctx) => {
      qc.setQueryData(invoiceKeys.detail(id), ctx?.previous); // roll back
    },
    onSettled: () => qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) }),
  });
}
```

## Consuming the hook

```tsx
const { mutate, isPending, error } = useCreateInvoice();
// disable with isPending; surface error to the user — do not copy data into Zustand.
```

## Hook test (fresh client, no retry)

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

it("invalidates the list after create", async () => {
  const { result } = renderHook(() => useCreateInvoice(), { wrapper: wrapper() });
  result.current.mutate({ customer: "Acme", amountCents: 100 });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

## Anti-patterns

- Do not `fetch` inside the component; mutate through the hook.
- Do not optimistically write the cache without an `onError` rollback.
- Do not store the mutated entity in Zustand; read it from the query cache.
- Do not forget to invalidate — stale lists are the most common bug here.
