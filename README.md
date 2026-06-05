# react-express-ai-kit

A drop-in collection of **Claude Code** extensibility artifacts — rules, skills, subagents, and hooks — tuned for a modular **React + Express + TypeScript** stack.

It encodes one architecture: feature-based **vertical slices** with one-way layering (`route → service → repository` on the backend, `component → hook → Query/API` for server state, and `component → hook/store` for UI state), **zod contracts shared across front and back end**, and parse-don't-validate at every boundary — then enforces it through Claude Code's native mechanisms.

Two things it deliberately does **not** hardcode:

- **The toolchain.** The package manager (pnpm / npm / yarn) and test runner (Vitest / Jest) are auto-detected at runtime from your lockfile and `package.json` by [`.claude/lib/detect-toolchain.sh`](.claude/lib/detect-toolchain.sh). In a monorepo, detection starts from the active working directory and runs scripts from its nearest package.
  Executable workflow commands route through it.
- **The ORM.** The data layer stays behind a generic repository interface, and the schema/migration subagent adapts to whatever ORM your repo uses (Prisma, Drizzle, Mongoose, Knex, TypeORM, raw SQL, …).

## The stack at a glance

Each tool owns one lane, so there's a single obvious place for each kind of work:

| Tool | What it does |
| --- | --- |
| **TypeScript** | Typed language across front and back end — catches mistakes as you write. |
| **React** | Builds the user interface (the screens). |
| **Vite** | Dev server and bundler for the frontend. |
| **React Router** | Maps each URL to the screen it should show (Data Mode — client-side). |
| **TanStack Query** | Fetches and caches server data on the frontend (owns server state). |
| **Zustand** | Holds small UI-only state (e.g. is this panel open). |
| **Express** | The backend HTTP server that answers API requests. |
| **zod** | Validates data at every boundary and is the shared FE/BE contract. |
| **Tailwind CSS** | Utility-first styling for the UI (v4, wired through the Vite plugin). |
| **Headless UI** | Unstyled, accessible interactive primitives (dialog, menu, combobox) that pair with Tailwind. |

The flow is one-way — `component → hook → Query/API` for frontend server state, `component → hook/store` for frontend UI state, and `route → service → repository → data` on the backend. **Server data lives in exactly one place** (TanStack Query), never mirrored into Zustand.

## Install

Copy the canonical `.claude/` directory into your project root:

```bash
cp -r .claude/ <your-project>/.claude/
```

That's it — no plugin, no marketplace, no build step.
Restart Claude Code (or start a new session) in the project so it picks up the rules, skills, agents, and hooks.

> The hooks reference scripts via `${CLAUDE_PROJECT_DIR}/.claude/...`, so the pack is fully portable — no absolute paths.
> If your repo already has a `.claude/settings.json`, merge the `hooks` block rather than overwriting (see [Hooks](#hooks-claudesettingsjson)).

## How each artifact type loads

| Type | Lives in | Loads when |
| --- | --- | --- |
| **Rule** | `.claude/rules/*.md` | Path-scoped rules load when Claude touches matching files; `architecture.md` (no `paths`) loads every session. |
| **Skill** | `.claude/skills/<name>/SKILL.md` | On demand — auto-loaded when relevant (driven by its `description`/`when_to_use`) or invoked with `/<name>`. |
| **Subagent** | `.claude/agents/*.md` | Delegated to by Claude when a task matches its `description`, or invoked explicitly. Runs in its own context + model. |
| **Hook** | `.claude/settings.json` + `.claude/hooks/*.sh` | Deterministically at lifecycle events (session start, after edits, before Bash). |

## Inventory

### Rules — path-scoped conventions (`.claude/rules/`)

| Rule | Applies to | Enforces |
| --- | --- | --- |
| `architecture.md` | *(always on)* | KISS/DRY/SRP/YAGNI, vertical slices, shared-layer placement, one-way layering, parse-don't-validate, "don't abstract until it earns it". |
| `typescript.md` | `**/*.{ts,tsx}` | strict TS, no `any`, infer over annotate, discriminated unions, exhaustive switches. |
| `backend-routes.md` | `**/routes/**`, `**/controllers/**`, `**/*.{route,routes,controller}.ts` | thin handlers: zod-parse → service → response; no logic/data access. |
| `backend-services.md` | `**/services/**`, `**/*.service.ts` | business logic only; depends on a repository interface; no HTTP leakage. |
| `backend-repositories.md` | `**/repositories/**`, `**/repository/**`, `**/*.repository.ts` | ORM-agnostic data-access boundary; returns domain types. |
| `frontend-components.md` | `**/components/**/*.tsx`, `**/ui/**/*.tsx` | function components (no `React.FC`); presentational, composable. |
| `frontend-forms.md` | `**/forms/**/*.tsx`, `**/*.form.tsx`, `**/*Form.tsx` | React Hook Form over the shared zod request contract; mutation-driven submission and accessible errors. |
| `frontend-hooks.md` | `**/hooks/**`, `**/use*.{ts,tsx}` | custom hooks; TanStack Query owns server state. |
| `frontend-routes.md` | `**/*.routes.tsx`, `**/router.tsx` | React Router v7 Data Mode route objects; feature-owned routes composed by one app router. |
| `frontend-state.md` | `**/store/**`, `**/stores/**`, `**/*.store.ts` | Zustand for UI state only; no mirrored server data. |
| `shared-contracts.md` | `**/contracts/**`, `**/schemas/**`, `**/*.schema.ts` | API/domain zod schemas as single source of truth; matched persistence/ORM schemas are classified and excluded. |
| `testing.md` | `**/*.{test,spec}.{ts,tsx}` | colocated, behavior-focused tests; mocked repos; user-centric RTL. |

Globs use directory-name conventions, so they survive different layouts (`src/`, `src/server`+`src/client`, `apps/web`+`apps/api`, feature folders).

### Skills — on-demand procedures (`.claude/skills/`)

| Skill | Invoke | Model | Does |
| --- | --- | --- | --- |
| `scaffold-feature` | `/scaffold-feature [name] [full\|api\|ui]` | sonnet | Generates a full vertical slice (FE/BE contract → backend layers → frontend layers → tests), wired to your detected layout. |
| `add-api-contract` | `/add-api-contract [name]` | sonnet | Creates/extends a feature-owned-by-default FE/BE zod contract and wires BE validation + a typed FE call. |
| `react-router` | `/react-router [route-or-feature-name]` | sonnet | Adds React Router v7 Data Mode routes in frontend feature slices, with zod-parsed URL state and TanStack Query prefetching. |
| `write-tests` | `/write-tests [path]` | sonnet | Writes colocated tests to convention; auto-detects Vitest/Jest. |
| `run-checks` | `/run-checks` | inherit | Quality gate: typecheck + lint + tests + build via the detected toolchain. |
| `style-component` | `/style-component [target]` | sonnet | Styles UI with Tailwind v4 utilities and Headless UI primitives; sets up Tailwind if it's missing. |
| `scaffold-form` | `/scaffold-form [name]` | sonnet | Builds a React Hook Form bound to the feature's zod request contract via `zodResolver`, submitting through a TanStack Query mutation with accessible, error-surfaced fields. |

Meatier skills keep templates and patterns in a `references/` subdirectory that loads only when needed.

### Subagents — isolated, model-routed workers (`.claude/agents/`)

| Subagent | Model | Use for |
| --- | --- | --- |
| `code-reviewer` | **opus** | Reviewing a diff for layering, contract drift, typing, and KISS/DRY/SRP/YAGNI. |
| `security-reviewer` | **opus** | OWASP-style review for this stack (boundary validation, authz, injection, secrets, XSS). |
| `schema-migration` | **sonnet** | Adaptive, ORM-agnostic schema changes and migrations. |
| `test-runner` | **haiku** | Running tests and returning a concise pass/fail summary without flooding context. |

Routing follows the principle: **opus** for review/security, **sonnet** for everyday code generation, **haiku** for mechanical work.

### Hooks (`.claude/settings.json`)

| Event | Script | Behavior |
| --- | --- | --- |
| `SessionStart` | `report-toolchain.sh` | Tells Claude the detected package manager + test runner and a one-line architecture reminder. |
| `PostToolUse` (Edit/Write) | `post-edit-check.sh` | Formats the edited `.ts/.tsx` file and lints it; reports lint errors back to Claude so it can self-correct. |
| `PreToolUse` (Bash) | `guard-package-manager.sh` | Asks for confirmation if a command installs deps with a package manager that contradicts the lockfile. |

The quality helpers and hooks use only locally installed tools (no auto-install), and every hook no-ops gracefully when the pack isn't present. **Hooks run every session** — to disable them, delete `.claude/settings.json` (or remove individual entries), or set `"disableAllHooks": true` in your settings.

## Authoring guides

Want to build your own rules, skills, commands, subagents, or hooks — or understand the ones here?
The [`docs/`](docs/) directory has a comprehensive guide per artifact type, using this pack's own files as worked examples:

- [Overview & "which mechanism do I use?"](docs/README.md)
- [Cross-cutting conventions](docs/conventions.md)
- [Rules](docs/rules.md) · [Skills](docs/skills.md) · [Slash commands](docs/slash-commands.md) · [Subagents](docs/subagents.md) · [Hooks](docs/hooks.md)

## Customization

- **Adopt the philosophy globally**: import the baseline into your project `CLAUDE.md` with `@.claude/rules/architecture.md`.
- **Different directory names?** Edit the `paths:` globs in the relevant rule.
- **Don't want a hook?** Remove its entry from `.claude/settings.json`.
- The shared detector is the single place to adjust executable toolchain behavior; examples may name supported package managers or runners.

## Requirements

- Claude Code (skills/subagents/hooks as documented at code.claude.com/docs).
- Bash for the hook/lib scripts; `node` is used opportunistically for robust JSON and falls back cleanly when unavailable.

## License

[MIT](LICENSE) © Thibaut Baissac
