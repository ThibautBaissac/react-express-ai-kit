---
paths:
  - "**/store/**/*.ts"
  - "**/stores/**/*.ts"
  - "**/*.store.ts"
---

# Global state — UI state only

Use stores for global client/UI state such as theme, sidebar, wizard step, and selections.
Keep server data in TanStack Query.
Do not mirror server data in Zustand.

## Do not duplicate server state

```ts
// ❌ server data copied into the store goes stale and forks the source of truth
const useStore = create((set) => ({
  invoices: [],
  loadInvoices: async () => set({ invoices: await api.get("/invoices") }),
}));

// ✅ server data via Query; store holds only UI state
type UiState = {
  selectedInvoiceId: string | null;
  select: (id: string | null) => void;
};
export const useInvoiceUi = create<UiState>((set) => ({
  selectedInvoiceId: null,
  select: (selectedInvoiceId) => set({ selectedInvoiceId }),
}));
```

## Keep stores small

Use one small store or slice per concern.
Do not build one global megastore.
Subscribe with selectors so components re-render only for the state they read.

```ts
const selectedId = useInvoiceUi((s) => s.selectedInvoiceId); // ✅ narrow selector
```

Keep actions next to the state they mutate.
Keep actions pure and minimal.

## Checklist

- [ ] Store holds UI/client state only.
- [ ] Server data stays in TanStack Query.
- [ ] Store or slice has one concern.
- [ ] Components subscribe with narrow selectors.
- [ ] Actions are colocated with the state they change.
