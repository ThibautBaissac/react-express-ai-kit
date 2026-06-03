---
paths:
  - "**/hooks/**/*.{ts,tsx}"
  - "**/use*.{ts,tsx}"
---

# Custom hooks — one responsibility

Hooks encapsulate stateful logic so components stay presentational.
Each hook should do one job.

## Use TanStack Query for server state

Fetch, cache, and mutate server data with Query.
Do not hand-roll server state with `useEffect` and `useState`.

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
// ❌ hand-rolled fetching has no caching, dedupe, or status handling
export function useInvoices() {
  const [data, setData] = useState<Invoice[]>([]);
  useEffect(() => { fetch("/api/invoices").then(r => r.json()).then(setData); }, []);
  return data;
}
```

## Invalidate after mutations

Mutations invalidate affected query keys.
Do not manually mirror server cache state unless the project already uses that pattern for optimistic updates.

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

- Keep one concern per hook.
- Compose hooks instead of growing one hook into a controller.
- Call hooks unconditionally at the top level.
- Memoize returned objects or callbacks only for identity-sensitive consumers.
- Centralize query keys for each feature.
- Parse responses with shared zod schemas.

## Checklist

- [ ] Server data uses `useQuery` or `useMutation`.
- [ ] No `useEffect` fetching for server state.
- [ ] Responses are parsed with shared zod schemas.
- [ ] Mutations invalidate affected query keys.
- [ ] Hook has one responsibility.
- [ ] Query keys are stable and centralized.
