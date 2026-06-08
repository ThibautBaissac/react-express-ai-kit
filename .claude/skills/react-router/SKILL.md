---
name: react-router
description: "Add or extend client-side routing with React Router v7 in Data Mode (createBrowserRouter + RouterProvider), wired to vertical slices, TanStack Query, and zod-parsed URL state."
when_to_use: "Use WHEN adding routes, nested layouts, route-level data loading, URL/search-param state, or navigation to the Vite React SPA — whether the user asks directly or an implementation agent is realizing a matching To-Do item from a `tasks/task-N.md` plan. Do NOT use to adopt Framework Mode / SSR (it replaces the Express backend), and do NOT move server-state ownership out of TanStack Query."
argument-hint: "[route-or-feature-name]"
arguments: [route]
model: sonnet
---

# Add React Router v7 routing

Add `$route` to the Vite SPA using React Router v7 **Data Mode**:
`createBrowserRouter` + `RouterProvider`, imported from `react-router`.
TanStack Query keeps server-state ownership. Do not adopt Framework/SSR or bare
Declarative Mode; Express remains the backend.

## Step 1 — Detect the toolchain and ensure the dep

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

If missing, add `react-router` with the detected package manager. Do not add
`react-router-dom`; v7 uses one package. Confirm major version 7.

## Step 2 — Place routing inside the feature slices

Keep frontend routing in vertical slices, never in backend `routes/`.
- One composition root, e.g. `app/router.tsx`, calls `createBrowserRouter` and is rendered by `<RouterProvider>` at the app entry.
- Each feature exports its own route objects (e.g. `features/invoice/invoice.routes.tsx`) that the root composes.
  A feature owns its routes like it owns its components and hooks.

## Step 3 — Define routes with lazy code-splitting

Apply `${CLAUDE_SKILL_DIR}/references/patterns.md` sections "Router setup" and
"Lazy routes".
- Use route objects with `Component`, nested `children`, `index`, and layout routes that render `<Outlet/>`.
- Split each feature's route with `lazy` so its bundle loads on navigation.

## Step 4 — Keep TanStack Query the source of truth for server data

Apply the reference section "TanStack Query integration".
- Components keep fetching through their `useQuery`/`useMutation` hooks.
  Do not re-fetch the same server data inside a `loader` and return it as a parallel source of truth.
- If a route needs to prefetch, have its `loader` call `queryClient.ensureQueryData(...)` for the feature's existing query key, then let the component read it via the same `useQuery` (warm cache).
- Use `action` only for non-Query mutations or progressive-enhancement forms; otherwise mutate via the existing TanStack Query mutation hook and invalidate keys.

## Step 5 — Parse URL and search params at the boundary

Apply the reference section "Typed params". Parse untrusted `params` and
`useSearchParams` with zod. Reuse an existing feature contract when it fits.

## Step 6 — Pending and error states

Surface pending state with `useNavigation`. Give routes an `ErrorBoundary`
(`ErrorBoundary`/`errorElement`) using `useRouteError`.

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
