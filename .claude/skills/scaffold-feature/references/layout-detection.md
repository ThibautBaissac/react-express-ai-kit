# Detecting the project layout

Match the repo's real structure. Inspect before generating; never impose a layout.

## Signals to read

1. **Monorepo?** Look for `pnpm-workspace.yaml`, a `workspaces` field in root
   `package.json`, or `apps/` + `packages/` dirs. If so, the API and web app are
   usually separate packages (`apps/api`, `apps/web`) with a shared package
   (`packages/shared` or `packages/contracts`) for zod schemas.
2. **Single app, split dirs?** `src/server` + `src/client`, or `src/api` + `src/app`.
   Shared schemas often live in `src/shared` or `src/contracts`.
3. **Feature folders?** If `src/features/<name>/` or `src/modules/<name>/` exists,
   create the whole slice inside one feature folder.
4. **Flat layered dirs?** `src/routes`, `src/services`, `src/repositories`,
   `src/components`, `src/hooks`, `src/store` — place each file in its matching dir.

## How to inspect

- List top-level dirs and look for `apps/`, `packages/`, `src/`.
- Grep for an existing feature to copy its conventions (file naming `*.service.ts` vs
  `*Service.ts`, default vs named exports, router registration style).
- Find where routers are registered (e.g. `app.use("/api", ...)` in `app.ts`/`server.ts`/
  `index.ts`) so the new router is wired in the same place.
- Find the API client the frontend uses (axios instance, `fetch` wrapper, `ky`) and reuse
  it in the new hook — don't introduce a new HTTP client.

## Placement decision

Prefer, in order: existing feature folder → shared package in a monorepo → split
server/client dirs → flat layered dirs. When two conventions conflict, follow the
nearest existing example to the feature you're adding.

## Where the shared schema goes

- Monorepo: the shared package both sides already import.
- Single repo: an environment-neutral dir importable by FE and BE (`src/shared`,
  `src/contracts`). If none exists, create `src/shared/` and note it in your summary.
