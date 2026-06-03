---
paths:
  - "**/hooks/**/*.{ts,tsx}"
  - "**/use*.{ts,tsx}"
---

# Custom hooks — one responsibility, server state via TanStack Query

Hooks encapsulate stateful logic so components stay presentational. Each hook does one
thing.

## Server state belongs to TanStack Query

Fetch, cache, and mutate server data with Query — not `useEffect` + `useState`.

```ts
// ✅ server state via Query, parsed at the edge
export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => InvoiceListResponse.parse(await api.get("/invoices")),
  });
}
```

```ts
// ❌ hand-rolled fetching: no caching, dedupe, or status handling
export function useInvoices() {
  const [data, setData] = useState<Invoice[]>([]);
  useEffect(() => { fetch("/api/invoices").then(r => r.json()).then(setData); }, []);
  return data;
}
```

## Mutations invalidate, they don't manually patch caches

```ts
export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInvoiceBody) => api.post("/invoices", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
```

## Rules
- One concern per hook; compose hooks rather than growing one giant hook.
- Obey the rules of hooks: call unconditionally at the top level.
- Memoize returned objects/callbacks (`useMemo`/`useCallback`) only when an identity-
  sensitive consumer needs it — not reflexively.
- Centralize query keys for a feature so invalidation stays consistent.

## Checklist
- [ ] Server data uses `useQuery`/`useMutation`, not `useEffect` fetching.
- [ ] Responses parsed with the shared zod schema.
- [ ] Mutations invalidate affected query keys on success.
- [ ] Hook has a single responsibility and stable query keys.
