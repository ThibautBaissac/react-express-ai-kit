# Detecting the project layout

Match the repo's real structure.
Inspect before generating.
Do not impose a new layout.

## Signals to read

1. **Monorepo?** Look for `pnpm-workspace.yaml`, a `workspaces` field, or `apps/` plus `packages/`.
2. **Split single app?** Look for `src/server` plus `src/client`, or `src/api` plus `src/app`.
3. **Feature folders?** If `src/features/<name>/` or `src/modules/<name>/` exists, create the slice there.
4. **Hybrid (feature folders + a shared layer)?** If feature folders coexist with a `shared/`, `common/`, or `core/` dir, that is the expected layout: domain code goes in the new feature slice, cross-cutting infra goes in the shared layer.
5. **Flat layered dirs?** If `src/routes`, `src/services`, `src/repositories`, `src/components`, `src/hooks`, or `src/store` exists, place files by layer.

## How to inspect

- List top-level dirs and look for `apps/`, `packages/`, and `src/`.
- Grep for an existing feature and copy its file naming, exports, router registration, and test style.
- Find where routers mount, such as `app.use("/api", ...)` in `app.ts`, `server.ts`, or `index.ts`.
- Find the frontend API client, such as an axios instance, fetch wrapper, or `ky` client, and reuse it.

## Placement decision

Domain code (the route/service/repository/components/hooks for this feature)
goes in:

1. An existing feature folder.
2. A new feature folder beside the existing ones in a hybrid layout.
3. Split server/client dirs.
4. Flat layered dirs.

Keep domain code out of `shared/`. Only put a file in the shared layer if it is
genuinely cross-cutting infra (a client, config, logger, or a generic
domain-free primitive) — see `architecture.md`. A normal feature scaffold does
not place its contract in `shared/` unless the contract is genuinely
cross-feature.
When conventions conflict, follow the nearest existing example.

## Where the contract schema goes

- Keep the contract in its owning feature when both sides can import it there.
- Use an existing shared package or environment-neutral contracts directory only
  when the contract is genuinely cross-feature.
