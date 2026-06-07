# react-express-ai-kit

An opinionated starting point for a React + Express + TypeScript app, bundled
with a Claude Code project pack for planning, scaffolding, review, and local
quality checks.

Use it when you want a small full-stack base with clear boundaries from day one:
one Vite React SPA, one Express API, shared zod contracts, Drizzle-backed data
access, and vertical feature slices instead of a loose pile of components and
controllers.

## Quick Start

```bash
pnpm install
pnpm dev
```

This starts:

- Vite web server for the SPA.
- Express API server from `src/server.ts`.
- Vite proxying `/api/*` to the API during development.

Useful commands:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm ci
```

Database commands are wired for Drizzle + SQLite:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

`DATABASE_URL` defaults to `./sqlite.db`.

## What You Get

The starter is deliberately narrow:

- React 19 SPA built with Vite.
- Express 5 API, also in TypeScript.
- React Router v7 in Data Mode.
- TanStack Query for all server state.
- Zustand only for UI-only state.
- zod 4 for request, response, URL, env, and API boundary parsing.
- Drizzle ORM with SQLite, hidden behind repository modules.
- Tailwind CSS v4 through the Vite plugin.
- Headless UI for accessible interactive primitives.
- Vitest, Testing Library, ESLint, Prettier, and strict TypeScript.
- A `.claude/` pack with rules, skills, subagents, hooks, and slash commands.

The app itself starts minimal: a root route, an API health response, shared
helpers for API calls, query client, env parsing, and DB access. Add real product
code under `src/features/`.

## Architecture

This repo uses a single `src/` tree with a hybrid layout:

```txt
src/
  features/<feature>/
    <feature>.schema.ts      # zod contract shared by frontend and backend
    <feature>.table.ts       # Drizzle table, when persistence is needed
    <feature>.repository.ts  # data access boundary
    <feature>.service.ts     # business logic
    <feature>.routes.ts      # thin Express handlers
    components/
    hooks/
    store/
    <feature>.routes.tsx     # frontend routes
    *.test.ts

  shared/
    lib/                     # db, env, API client, query client, config
    ui/                      # generic UI primitives only
    contracts/               # cross-feature contracts only
```

The core rules:

- Backend flow is `route -> service -> repository -> data`.
- Frontend server data flows `component -> hook -> TanStack Query -> API`.
- Frontend UI-only state may use `component -> hook/store -> Zustand`.
- Features may import `shared/`; `shared/` never imports a feature.
- Avoid feature-to-feature imports. Coordinate cross-feature work at a composition
  boundary or revisit ownership.
- Parse untrusted input with zod at the boundary, then trust the parsed type.
- Do not mirror server data into Zustand.
- Do not add domain abstractions before a third real use proves the shape.

More detail lives in [CLAUDE.md](CLAUDE.md) and
[.claude/rules/architecture.md](.claude/rules/architecture.md).

## Starting A New Project

1. Rename the package and app title.
2. Replace the placeholder app description in [CLAUDE.md](CLAUDE.md).
3. Keep the stack unless you have a concrete reason to change it.
4. Add the first domain slice under `src/features/<feature>/`.
5. Put shared infrastructure in `src/shared/lib`; keep domain logic out of
   `shared/`.
6. Add zod contracts before wiring routes or forms.
7. Add Drizzle tables only for persisted features, then generate migrations.
8. Keep tests colocated with the feature code they prove.

For a new feature, the intended shape is:

```bash
/scaffold-feature invoices full
```

Then review and adapt the generated slice rather than hand-rolling a different
layout.

## Claude Code Workflow

The `.claude/` directory is part of the starter. It gives Claude Code the same
architecture and quality bar every session.

Practical commands:

```txt
/scaffold-feature <name> [full|api|ui]
/add-api-contract <name>
/react-router <route-or-feature>
/scaffold-form <name>
/style-component <target>
/write-tests <path>
/run-checks
```

For larger work, use the task pipeline:

```txt
/specs-generation docs/brief.md
/adversarial-specs-review docs/brief.md tasks/specs.md
/plan 1
/adversarial-task-plan-review 1
/implementation 1
/review 1
/refinement 1
/ci-gate 1
```

The pipeline writes task files under `tasks/` using
[templates/plan-template.md](templates/plan-template.md). The helper scripts
[scripts/complete-plan.ts](scripts/complete-plan.ts) and
[scripts/complete-workflow.ts](scripts/complete-workflow.ts) mark task status in
`tasks/task-N.status.json`.

Hooks in [.claude/settings.json](.claude/settings.json) do three things:

- Report the detected package manager and test runner at session start.
- Format and lint edited TypeScript files after writes.
- Warn before installing dependencies with a package manager that conflicts with
  the lockfile.

The toolchain detector lives in
[.claude/lib/detect-toolchain.sh](.claude/lib/detect-toolchain.sh). When copying
the `.claude/` pack into another repo, route checks through its helpers:

```bash
source .claude/lib/detect-toolchain.sh
run_typecheck
run_lint
run_tests
run_build
```

## Customizing The Starter

Good defaults to keep:

- One root package and one `src/` tree.
- Feature-owned contracts by default.
- Repository modules as the only place Drizzle is imported.
- TanStack Query as the only server-state cache.
- React Hook Form + zod contracts for forms.
- Tailwind utilities plus Headless UI for interactive controls.

Reasonable changes:

- Swap SQLite for another Drizzle-supported database.
- Add authentication once a feature needs it.
- Add shared UI primitives as the design system emerges.
- Disable a Claude hook by editing `.claude/settings.json`.

Avoid early:

- A generic service layer in `shared/`.
- A global `types/` folder for domain types.
- Mirroring API data into Zustand.
- Cross-feature imports to save a few lines.
- New abstractions before there are repeated, real call sites.

## Requirements

- Node 20 or newer.
- pnpm, matching the checked-in lockfile.
- Claude Code if you want the `.claude/` workflow.

## License

[MIT](LICENSE) © Thibaut Baissac
