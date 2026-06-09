# CLAUDE.md

Generic project memory for a React + Express + TypeScript app using this `.claude/` pack.
Loaded every session — keep it lean.
Rule of thumb: if removing a line wouldn't cause a mistake, cut it.
Fill in the `<…>` placeholders; delete what doesn't apply.

## What this project is

<One sentence: what the app does and who it's for.>
A Vite React SPA talking to a separate Express API, both in TypeScript.
Server state lives in TanStack Query; UI-only state in Zustand; routing via React Router (Data Mode); data validated at every boundary with shared zod contracts.

## Commands

Toolchain is auto-detected (package manager + test runner) — prefer the helpers, don't hardcode.

```bash
# Detect once per shell, then use the routed helpers:
source .claude/lib/detect-toolchain.sh
run_typecheck   # type check
run_lint        # lint
run_tests       # run the test suite
run_build       # production build
```

Direct equivalents: `pnpm install`, `pnpm dev`, `pnpm test`.

Browser e2e runs through **Playwright** (`pnpm e2e`) — committed specs in `e2e/`,
vendor-neutral (no model-specific browser tool). Playwright's `webServer` migrates +
seeds an isolated `./e2e.db` and starts/stops the API + web server itself; don't run
dev servers by hand for e2e. `e2e/responsive.spec.ts` writes 375px/1440px screenshots
to `e2e/screenshots/` for visual review. `pnpm e2e:report` opens the last HTML report.

## Where things live

**Single `src/` root, hybrid layout:** domain code in **feature slices**, cross-cutting infra in a **`shared/` layer**.

```
src/
  features/<feature>/       # one slice owns its domain end to end
    <feature>.schema.ts     # zod contract for this feature (FE + BE)
    <feature>.routes.ts     # thin Express handlers
    <feature>.service.ts    # business logic
    <feature>.repository.ts # data access (ORM-agnostic)
    components/  hooks/  store/  <feature>.routes.tsx # frontend slice
    *.test.ts               # colocated tests

  shared/                   # cross-cutting infra only — never domain logic
    ui/                     # generic, domain-free UI primitives
    lib/                    # db/http client, logger, config
    contracts/              # cross-feature zod contracts (FE + BE)
```

- Domain code always lives in a feature; `shared/` is for things generic by nature. See @.claude/rules/architecture.md.
- This project uses one root package with one `src/` tree. Keep React and Express entry points in `src/`, and add new domain code under `src/features`.
- ORM: Drizzle, behind the repository interface.

## Rules that prevent mistakes

- **One-way flow.** Backend `route → service → repository → data`; frontend `component → hook → store/query → API`.
  Never skip or reverse a layer; no DB calls in routes; never pass `req`/`res` into services.
- **Features depend on `shared/`, never the reverse.** No feature-to-feature imports; keep domain logic out of `shared/`.
- **One source of truth for server data:** TanStack Query.
  Never mirror server data into Zustand.
- **Parse, don't validate.** Convert untrusted input (req body/params/query, API responses, URL params) into typed values with zod at the boundary, then trust the type.
- **No new domain abstraction before its third real use.** Prefer duplication over the wrong abstraction. (Cross-cutting infra in `shared/` is exempt — stand it up when first needed.)
- Don't run a linter's job by hand — let the format/lint hook handle style.

## Skills (invoke with `/name`)

`/scaffold-feature` · `/add-api-contract` · `/add-mutation` · `/scaffold-form` · `/react-router` · `/style-component` · `/scaffold-auth` · `/scaffold-authz` · `/api-error-handling` · `/scaffold-seed` · `/write-tests` · `/run-checks`

## Deeper docs (loaded on demand)

- Architecture baseline: @.claude/rules/architecture.md
- Authoring guide / overview: @docs/README.md

> When I get something wrong (wrong path, broken convention), tell me to add the correction here.
