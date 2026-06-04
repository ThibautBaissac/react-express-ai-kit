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

Direct equivalents (adjust to your package manager): `<pm> install`, `<pm> dev`, `<pm> test`.

## Where things live

Code is organized by **feature (vertical slice)**, not by technical layer:

```
features/<feature>/
  <feature>.schema.ts       # shared zod contract (FE + BE)
  <feature>.routes.ts       # thin Express handlers
  <feature>.service.ts      # business logic
  <feature>.repository.ts   # data access (ORM-agnostic)
  components/  hooks/  store/  <feature>.routes.tsx   # frontend slice
  *.test.ts                 # colocated tests
```

- Adjust the root to your layout (`src/`, `apps/web` + `apps/api`, etc.).
- ORM: `<Prisma | Drizzle | Mongoose | … >`, behind the repository interface.

## Rules that prevent mistakes

- **One-way flow.** Backend `route → service → repository → data`; frontend `component → hook → store/query → API`.
  Never skip or reverse a layer; no DB calls in routes; never pass `req`/`res` into services.
- **One source of truth for server data:** TanStack Query.
  Never mirror server data into Zustand.
- **Parse, don't validate.** Convert untrusted input (req body/params/query, API responses, URL params) into typed values with zod at the boundary, then trust the type.
- **No new abstraction before its third real use.** Prefer duplication over the wrong abstraction.
- Don't run a linter's job by hand — let the format/lint hook handle style.

## Skills (invoke with `/name`)

`/scaffold-feature` · `/add-api-contract` · `/react-router` · `/write-tests` · `/run-checks`

## Deeper docs (loaded on demand)

- Architecture baseline: @.claude/rules/architecture.md
- Authoring guide / overview: @docs/README.md

> When I get something wrong (wrong path, broken convention), tell me to add the correction here.
