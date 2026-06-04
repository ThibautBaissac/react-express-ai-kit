---
name: react-router
description: "Add or extend client-side routing with React Router v7 in Data Mode (createBrowserRouter + RouterProvider), wired to vertical slices, TanStack Query, and zod-parsed URL state."
when_to_use: "Use WHEN adding routes, nested layouts, route-level data loading, URL/search-param state, or navigation to the Vite React SPA. Do NOT use to adopt Framework Mode / SSR (it replaces the Express backend), and do NOT move server-state ownership out of TanStack Query."
argument-hint: "[route-or-feature-name]"
arguments: [route]
model: sonnet
---

# Add React Router v7 routing

This stack is a Vite React SPA talking to a separate Express API, with TanStack Query owning
server state. The matching React Router mode is **Data Mode** — `createBrowserRouter` +
`RouterProvider`, importing everything from the single `react-router` package (v7). Route: `$route`.

Do **not** use Framework Mode: it is a full-stack SSR framework (the successor to Remix) that
would take over the role Express already plays. Do **not** use bare Declarative Mode either —
Data Mode adds the pending states, error boundaries, and route-level orchestration this app wants.

## Step 1 — Detect the toolchain and ensure the dep

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

If `react-router` is not in the frontend `package.json`, add it with the detected package
manager (it is one package — there is no separate `react-router-dom` in v7). Confirm the
installed major version is 7.

## Step 2 — Place routing inside the feature slices

Keep routing on the frontend side of the layout and inside vertical slices — never under a
backend `routes/` directory (that name is owned by the backend-routes rule).
- One composition root, e.g. `app/router.tsx`, calls `createBrowserRouter` and is rendered by
  `<RouterProvider>` at the app entry.
- Each feature exports its own route objects (e.g. `features/invoice/invoice.routes.tsx`) that the
  root composes. A feature owns its routes like it owns its components and hooks.

## Step 3 — Define routes with lazy code-splitting

Read `${CLAUDE_SKILL_DIR}/references/patterns.md` (sections "Router setup" and "Lazy routes") and apply it.
- Use route objects with `Component`, nested `children`, `index`, and layout routes that render `<Outlet/>`.
- Split each feature's route with `lazy` so its bundle loads on navigation.

## Step 4 — Keep TanStack Query the source of truth for server data

Read `${CLAUDE_SKILL_DIR}/references/patterns.md` section "TanStack Query integration".
- Components keep fetching through their `useQuery`/`useMutation` hooks. Do not re-fetch the same
  server data inside a `loader` and return it as a parallel source of truth.
- If a route needs to prefetch, have its `loader` call `queryClient.ensureQueryData(...)` for the
  feature's existing query key, then let the component read it via the same `useQuery` (warm cache).
- Use `action` only for non-Query mutations or progressive-enhancement forms; otherwise mutate via
  the existing TanStack Query mutation hook and invalidate keys.

## Step 5 — Parse URL and search params at the boundary

Read `${CLAUDE_SKILL_DIR}/references/patterns.md` section "Typed params". Treat `params` and
`useSearchParams` as untrusted input: parse them with a zod schema into typed values, then trust the
type. Reuse the feature's shared schema where one already covers the shape.

## Step 6 — Pending and error states

Surface navigation pending state with `useNavigation`, and give routes an `ErrorBoundary` (route
object `ErrorBoundary`/`errorElement`) using `useRouteError`. See the references file.

## Step 7 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
```

## Checklist

- [ ] Data Mode only: `createBrowserRouter` + `RouterProvider`, imports from `react-router` (v7).
- [ ] No Framework/SSR adoption; Express stays the backend.
- [ ] Routes live in feature slices on the frontend, composed by one root; not under backend `routes/`.
- [ ] Server state still owned by TanStack Query; loaders at most prefetch into the query client.
- [ ] `params`/search params parsed with zod into typed values.
- [ ] Routes are lazy-split and have pending + error states.
- [ ] `run_typecheck` passes.
