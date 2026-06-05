---
paths:
  - "**/components/**/*.tsx"
  - "**/ui/**/*.tsx"
---

# React components — presentational and composable

Components render UI from props. Hooks or stores own data loading and business logic.

## Use function components

Use typed props and plain functions.
Do not use `React.FC`.

```tsx
// ❌ React.FC adds implicit children and awkward generics
const InvoiceRow: React.FC<{ invoice: Invoice }> = ({ invoice }) => { /* ... */ };

// ✅ plain function with typed props
type InvoiceRowProps = { invoice: Invoice; onSelect?: (id: string) => void };
export function InvoiceRow({ invoice, onSelect }: InvoiceRowProps) {
  return <tr onClick={() => onSelect?.(invoice.id)}>{invoice.id}</tr>;
}
```

## Separate rendering from data loading

Keep presentational components free of `useQuery` and `fetch`.
A container or hook supplies data.

```tsx
// ❌ fetching inside a presentational component
function InvoiceList() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch("/api/invoices").then(/* ... */); }, []);
  return /* ... */;
}

// ✅ data comes from a hook; the component renders
function InvoiceListContainer() {
  const { data, isLoading } = useInvoices();
  if (isLoading) return <Spinner />;
  return <InvoiceList invoices={data} />;
}
```

## Compose before configuring

Build small components with props, children, and slots. Avoid flag-heavy components.

Generic, domain-free primitives (`Button`, `Input`, `Dialog`) start in
`shared/ui`. Extract a domain component after its third real use proves the
shape. If it still has domain props, keep it in the feature.

## Rules

- Keep business logic out of presentational components.
- Derive display state in hooks or selectors when it grows.
- Use `useEffect` only to synchronize with external systems.
- Do not use effects for state that can be computed during render.
- Use stable list keys.
- Never use array indexes as keys when items can reorder.

## Checklist

- [ ] Component is a plain function with typed props.
- [ ] No `React.FC`.
- [ ] Presentational components do not fetch data.
- [ ] Business logic lives in a hook, selector, or service.
- [ ] Composition is preferred over flag-heavy configuration.
- [ ] Effects synchronize with external systems only.
