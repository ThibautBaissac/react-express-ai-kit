# react-express-ai-kit

An opinionated starter for a React + Express + TypeScript application, bundled
with a Claude Code project pack for architecture guidance, scaffolding, planning,
review, and local quality checks.

Use it when you want a small full-stack base with clear boundaries from day one:
one Vite React SPA, one Express API, shared zod contracts, Drizzle-backed data
access, and vertical feature slices instead of scattered components and
controllers.

## Development Workflow

This kit is designed to be used with the committed Claude Code pack, not just as
a dependency list. Start product work from a brief, turn it into task files, let
the pack implement against those task files, then run review and CI gates before
moving on.

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

The workflow is backed by `CLAUDE.md`, `.claude/rules/`, `.claude/skills/`, and `.claude/hooks/`, so every agent session sees the same
architecture rules, task format, and quality gate.

## Quick Start

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs both development servers:

- Vite serves the React SPA.
- `tsx watch src/server.ts` runs the Express API.
- Vite proxies `/api/*` to the API server, which defaults to
  `http://localhost:3000`.

The starter app currently renders a single root page and exposes
`GET /api/health`, which returns `{ "status": "ok" }`.

## Commands

```bash
pnpm dev             # run web + API in development
pnpm dev:web         # run only the Vite web server
pnpm dev:api         # run only the Express API server
pnpm typecheck       # TypeScript, no emit
pnpm lint            # ESLint
pnpm test            # Vitest unit/integration tests
pnpm e2e             # Playwright browser tests
pnpm build           # build client and server
pnpm start           # run the built API server
pnpm preview         # preview the built client
pnpm ci              # typecheck + lint + test + build
```

Database commands are wired for Drizzle + SQLite:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

`DATABASE_URL` defaults to `./sqlite.db`. Drizzle scans feature tables from
`src/features/**/*.table.ts`; the starter has no persisted feature tables yet, so
`scripts/seed.ts` is currently a placeholder.

## What You Get

- React 19 SPA built with Vite.
- Express 5 API, also in TypeScript.
- React Router v7 in Data Mode.
- TanStack Query for server state.
- Zustand for UI-only state.
- zod 4 for request, response, URL, environment, and API boundary parsing.
- Drizzle ORM with SQLite through `better-sqlite3`.
- Tailwind CSS v4 through the Vite plugin.
- Headless UI and React Hook Form for accessible interactive UI.
- Vitest, Testing Library, Playwright, ESLint, Prettier, and strict TypeScript.
- A `.claude/` pack with project rules, skills, slash commands, hooks, and
  authoring docs.

## Project Layout

This repo uses one package and one `src/` tree. The current app is intentionally
minimal, with feature slices added as product code appears.

```txt
src/
  apiApp.ts                  # Express app factory and central error handler
  server.ts                  # API server entry point
  main.tsx                   # React entry point
  router.tsx                 # React Router Data Mode router
  App.tsx                    # starter root route
  app.test.ts                # starter API smoke test

  features/<feature>/        # add domain slices here
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
    lib/                     # db, env, API client, query client
    ui/                      # generic UI primitives only
    contracts/               # cross-feature contracts only
```

The core dependency rules are:

- Backend flow is `route -> service -> repository -> data`.
- Frontend server data flows `component -> hook -> TanStack Query -> API`.
- UI-only state may use Zustand, but server data should not be mirrored there.
- Features may import `shared/`; `shared/` must not import features.
- Avoid feature-to-feature imports. Coordinate at a composition boundary instead.
- Parse untrusted input with zod at the boundary, then trust the parsed type.
- Do not add domain abstractions before a third real use proves the shape.

More detail lives in [CLAUDE.md](CLAUDE.md) and
[.claude/rules/architecture.md](.claude/rules/architecture.md).

## Testing

Vitest runs the colocated TypeScript tests and excludes `e2e/**`.

```bash
pnpm test
```

Playwright runs a real Express + Vite stack through `webServer`.

```bash
pnpm e2e
```

The e2e suite currently checks the app shell and API health endpoint. It does
not run migrations or seed data for the starter because no persisted feature
exists yet. When you add persisted features, extend the Playwright API
`webServer` command to migrate and seed an isolated test database.

`e2e/responsive.spec.ts` writes visual-review screenshots for 375px mobile and
1440px desktop to `e2e/screenshots/`. Use `pnpm e2e:report` to open the latest
Playwright HTML report.

## Claude Code Pack

`AGENTS.md` is a symlink to [CLAUDE.md](CLAUDE.md), so agents that read either
file get the same project memory.

The committed `.claude/` pack includes:

- Always-on and path-scoped rules under `.claude/rules/`.
- Skills under `.claude/skills/`, including `/scaffold-feature`, `/add-api-contract`,
  `/add-mutation`, `/scaffold-form`, `/react-router`, `/style-component`,
  `/scaffold-auth`, `/api-error-handling`, `/scaffold-seed`, `/write-tests`, and
  `/run-checks`.
- Workflow commands under `.claude/commands/`: `/specs-generation`,
  `/adversarial-specs-review`, `/plan`, `/adversarial-task-plan-review`,
  `/implementation`, `/review`, `/refinement`, and `/ci-gate`.
- Hooks under `.claude/hooks/` for session toolchain reporting, package-manager
  guardrails, and post-edit format/lint checks.
- Authoring docs under `docs/` for rules, skills, slash commands, subagents, and
  hooks. The docs cover subagents as a Claude Code mechanism, but this starter
  does not currently ship `.claude/agents/` definitions.

For agent-driven quality checks, prefer the toolchain detector instead of
hardcoding package-manager commands:

```bash
source .claude/lib/detect-toolchain.sh
run_typecheck
run_lint
run_tests
run_build
```

The planning workflow writes task files under `tasks/` using
[templates/plan-template.md](templates/plan-template.md). The helper scripts
[scripts/complete-plan.ts](scripts/complete-plan.ts) and
[scripts/complete-workflow.ts](scripts/complete-workflow.ts) update
`tasks/task-N.status.json`.

## Starting A Product

1. Rename the package and app title.
2. Replace the placeholder app description in [CLAUDE.md](CLAUDE.md).
3. Add the first domain slice under `src/features/<feature>/`.
4. Define zod contracts before wiring routes, API calls, or forms.
5. Add Drizzle tables only for persisted features, then generate migrations.
6. Keep tests colocated with the feature code they prove.

For a new feature, the intended entry point is:

```txt
/scaffold-feature invoices full
```

Review and adapt the generated slice instead of introducing a different layout.

## Requirements

- Node 20 or newer.
- pnpm, matching the checked-in lockfile.
- Claude Code, if you want to use the `.claude/` workflow.

## License

[MIT](LICENSE) © Thibaut Baissac
