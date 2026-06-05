---
paths:
  - "**/*.routes.tsx"
  - "**/router.tsx"
---

# React Router routes — Data Mode in the SPA

Frontend routes use React Router v7 Data Mode. Route objects live in feature
slices and are composed by one app router. Express remains the backend.

## Keep frontend and backend routes separate

```tsx
// ❌ frontend route objects under backend route conventions
// routes/invoice.routes.tsx
export const invoiceRoutes = [{ path: "/invoices", Component: InvoiceList }];

// ✅ feature-owned frontend route objects
// features/invoice/invoice.routes.tsx
export const invoiceRoutes = [{ path: "/invoices", Component: InvoiceList }];
```

The composition root (`app/router.tsx`) creates the browser router and renders
through `RouterProvider`. Feature route files export route objects only.

## Keep TanStack Query as the server-state source

Loaders may prefetch into the Query client, but components still read server
data through the same `useQuery` hooks. Do not return fetched server data from a
loader as a parallel source of truth.

```tsx
// ✅ loader warms the existing query cache
export async function detailLoader({ params }: LoaderFunctionArgs) {
  const { id } = InvoiceParams.parse(params);
  await queryClient.ensureQueryData(invoiceQuery(id));
  return null;
}
```

## Parse URL state

Treat `params` and search params as untrusted input. Parse them with zod at the
route boundary, reusing feature contracts when they fit.

## Rules

- Use `createBrowserRouter` and `RouterProvider` from `react-router`.
- Keep route objects in frontend feature slices, not backend route folders.
- Use lazy route modules for feature screens when practical.
- Use loaders only to prefetch into TanStack Query unless an existing pattern says otherwise.
- Add route-level pending and error states with `useNavigation` and `ErrorBoundary` or `errorElement`.

## Checklist

- [ ] Route is frontend-only React Router Data Mode; no Framework/SSR adoption.
- [ ] Feature route objects are composed by one app router.
- [ ] Server data remains owned by TanStack Query.
- [ ] URL params/search params are parsed with zod.
- [ ] Route has appropriate pending and error handling.
