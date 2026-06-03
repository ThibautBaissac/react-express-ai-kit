---
paths:
  - "**/components/**/*.tsx"
---

# React components — presentational and composable

Components render UI from props. Data fetching and business logic live in hooks/stores,
not inside the component body.

## Function components, typed props, no `React.FC`

```tsx
// ❌ React.FC (implicit children, awkward generics)
const InvoiceRow: React.FC<{ invoice: Invoice }> = ({ invoice }) => { /* ... */ };

// ✅ plain function with a typed props object
type InvoiceRowProps = { invoice: Invoice; onSelect?: (id: string) => void };
export function InvoiceRow({ invoice, onSelect }: InvoiceRowProps) {
  return <tr onClick={() => onSelect?.(invoice.id)}>{invoice.id}</tr>;
}
```

## Separate "what to show" from "how to get it"

Keep presentational components free of `useQuery`/`fetch`. A container/hook supplies data.

```tsx
// ❌ fetching inside a presentational component
function InvoiceList() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch("/api/invoices").then(/* ... */); }, []);
  return /* ... */;
}

// ✅ data comes from a hook; the component just renders
function InvoiceListContainer() {
  const { data, isLoading } = useInvoices();
  if (isLoading) return <Spinner />;
  return <InvoiceList invoices={data} />;
}
```

## Compose, don't over-configure

Build from small components and `children`/slots rather than one component with many
boolean flags. Extract a shared component only after a third real use.

## Rules
- No business logic in components — derive it in a hook or selector.
- Effects (`useEffect`) only for synchronizing with external systems, not for deriving
  state you can compute during render.
- Stable keys for lists (never the array index when items reorder).

## Checklist
- [ ] Function component with a typed props type; no `React.FC`.
- [ ] No `fetch`/`useQuery`/business logic in presentational components.
- [ ] Composed from small pieces, not a flag-heavy mega-component.
- [ ] Effects only synchronize with the outside world.
