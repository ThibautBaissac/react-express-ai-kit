---
paths:
  - "**/store/**/*.ts"
  - "**/stores/**/*.ts"
  - "**/*.store.ts"
---

# Global state (Zustand) — UI state only

Use a store for global **client/UI** state (theme, sidebar, multi-step wizard,
selections). Server data stays in TanStack Query — don't mirror it here.

## Don't duplicate server state

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

## SRP slices, selector subscriptions

- One small store (or slice) per concern; don't build a single global megastore.
- Subscribe with a selector so components re-render only on the slice they read.

```ts
const selectedId = useInvoiceUi((s) => s.selectedInvoiceId); // ✅ narrow selector
```

- Keep actions in the store next to the state they mutate; keep them pure and minimal.

## Checklist
- [ ] Store holds UI/client state only — no cached server data.
- [ ] One cohesive concern per store/slice (SRP).
- [ ] Components subscribe via narrow selectors, not the whole store.
- [ ] Actions colocated with the state they change.
