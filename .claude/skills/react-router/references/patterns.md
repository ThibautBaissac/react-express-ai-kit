# React Router v7 (Data Mode) — patterns

Import only from `react-router`; v7 has no `react-router-dom`.

## Router setup

```tsx
// app/router.tsx
import { createBrowserRouter, RouterProvider } from "react-router";
import { invoiceRoutes } from "../features/invoice/invoice.routes";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout, // renders <Outlet/>, nav, etc.
    children: [
      { index: true, Component: Home },
      ...invoiceRoutes,
    ],
  },
]);
```

```tsx
// app/main.tsx
import { RouterProvider } from "react-router";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
```

Layout route renders nested matches through `<Outlet/>`:

```tsx
import { Outlet, NavLink } from "react-router";

export function AppLayout() {
  return (
    <>
      <nav><NavLink to="/invoices">Invoices</NavLink></nav>
      <Outlet />
    </>
  );
}
```

## Lazy routes

Each feature exports route objects. Load heavy components and loaders via `lazy`.

```tsx
// features/invoice/invoice.routes.tsx
import type { RouteObject } from "react-router";

export const invoiceRoutes: RouteObject[] = [
  {
    path: "invoices",
    children: [
      {
        index: true,
        lazy: async () => {
          const { InvoiceList, listLoader } = await import("./components/InvoiceList");
          return { Component: InvoiceList, loader: listLoader };
        },
      },
      {
        path: ":invoiceId",
        lazy: async () => {
          const { InvoiceDetail, detailLoader } = await import("./components/InvoiceDetail");
          return { Component: InvoiceDetail, loader: detailLoader };
        },
      },
    ],
  },
];
```

## TanStack Query integration

TanStack Query owns server state. Loaders only *warm the cache*. Components read
the same `useQuery` hook on direct and client navigation.

```tsx
// features/invoice/components/InvoiceDetail.tsx
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { invoiceQuery } from "../hooks/useInvoice"; // queryKey + queryFn factory
import { queryClient } from "../../../app/queryClient";
import { InvoiceParams } from "../invoice.schema";

// Prefetch into the shared client; do not return data as a parallel source of truth.
export async function detailLoader({ params }: { params: Record<string, string | undefined> }) {
  const { invoiceId } = InvoiceParams.parse(params);
  await queryClient.ensureQueryData(invoiceQuery(invoiceId));
  return null;
}

export function InvoiceDetail() {
  const { invoiceId } = InvoiceParams.parse(useParams());
  const { data } = useQuery(invoiceQuery(invoiceId)); // warm cache from the loader
  return <h1>{data?.number}</h1>;
}
```

```tsx
// hooks/useInvoice.ts — centralized query factory (stable keys)
import { queryOptions } from "@tanstack/react-query";
import { InvoiceResponse } from "../invoice.schema";

export const invoiceQuery = (id: string) =>
  queryOptions({
    queryKey: ["invoices", id],
    queryFn: async () => InvoiceResponse.parse(await api.get(`/invoices/${id}`)),
  });
```

Prefer existing Query mutation hooks and invalidate keys in `onSuccess`. Use a
route `action` only for non-Query flows or progressive-enhancement `<Form>`:

```tsx
import { redirect } from "react-router";

export async function createInvoiceAction({ request }: { request: Request }) {
  const body = CreateInvoiceBody.parse(Object.fromEntries(await request.formData()));
  const created = InvoiceResponse.parse(await api.post("/invoices", body));
  await queryClient.invalidateQueries({ queryKey: ["invoices"] });
  return redirect(`/invoices/${created.id}`);
}
```

## Typed params

Route and search params are untrusted strings. Parse them with zod at the
boundary; reuse feature contracts where they fit.

```tsx
// invoice.schema.ts
import { z } from "zod";
export const InvoiceParams = z.object({ invoiceId: z.string().uuid() });
export const InvoiceListQuery = z.object({
  status: z.enum(["draft", "sent", "paid"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
```

```tsx
import { useSearchParams } from "react-router";

export function useInvoiceListQuery() {
  const [searchParams] = useSearchParams();
  return InvoiceListQuery.parse(Object.fromEntries(searchParams));
}
```

## Pending and error states

```tsx
import { useNavigation } from "react-router";

export function AppLayout() {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  return <main aria-busy={busy}><Outlet /></main>;
}
```

```tsx
import { useRouteError, isRouteErrorResponse } from "react-router";

export function InvoiceError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) return <p>{error.status} — {error.statusText}</p>;
  return <p>Something went wrong.</p>;
}
// attach via the route object: { path: ":invoiceId", Component, ErrorBoundary: InvoiceError }
```

## Why Data Mode (not Framework / Declarative)

- **Framework Mode** owns routing, SSR, Vite integration, and the server. It
  would replace Express.
- **Declarative Mode** (`<BrowserRouter>`) lacks loaders, pending states, and
  route error boundaries.
- **Data Mode** fits a Vite SPA with an external API and adds route orchestration.
