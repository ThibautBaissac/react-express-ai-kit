# Detecting the project layout

Match the repo's real structure.
Inspect before generating.
Do not impose a new layout.

## Signals to read

1. **Monorepo?** Look for `pnpm-workspace.yaml`, a `workspaces` field, or `apps/` plus `packages/`.
2. **Split single app?** Look for `src/server` plus `src/client`, or `src/api` plus `src/app`.
3. **Feature folders?** If `src/features/<name>/` or `src/modules/<name>/` exists, create the slice there.
4. **Flat layered dirs?** If `src/routes`, `src/services`, `src/repositories`, `src/components`, `src/hooks`, or `src/store` exists, place files by layer.

## How to inspect

- List top-level dirs and look for `apps/`, `packages/`, and `src/`.
- Grep for an existing feature and copy its file naming, exports, router registration, and test style.
- Find where routers mount, such as `app.use("/api", ...)` in `app.ts`, `server.ts`, or `index.ts`.
- Find the frontend API client, such as an axios instance, fetch wrapper, or `ky` client, and reuse it.

## Placement decision

Prefer an existing feature folder.
Next prefer the shared package in a monorepo.
Next prefer split server/client dirs.
Last use flat layered dirs.
When conventions conflict, follow the nearest existing example.

## Where the shared schema goes

- Monorepo: use the shared package both sides already import.
- Single repo: use an environment-neutral directory importable by FE and BE, such as `src/shared` or `src/contracts`.
- If no shared location exists, create `src/shared/` and note it in the summary.
