# ORM / data-layer detection

Identify the project's data layer before changing schema.
Detect; do not assume.

## Signals by tool

| Tool | `package.json` dep | Config / schema files | Migration command |
|---|---|---|---|
| **Prisma** | `prisma`, `@prisma/client` | `prisma/schema.prisma`, `prisma/migrations/` | `prisma migrate dev --name <x>` in dev, then `prisma generate` |
| **Drizzle** | `drizzle-orm`, `drizzle-kit` | `drizzle.config.ts`, `*.schema.ts`, `drizzle/` | `drizzle-kit generate`, then `drizzle-kit migrate` |
| **Mongoose** | `mongoose` | `*.model.ts` with `new Schema({...})` | No default migration framework; inspect `migrate-mongo` or project scripts. |
| **TypeORM** | `typeorm` | `ormconfig.*`, `*.entity.ts`, `@Entity()` | `typeorm migration:generate`, then `typeorm migration:run` |
| **Knex** | `knex` | `knexfile.{ts,js}`, `migrations/` | `knex migrate:make <x>`, then `knex migrate:latest` |
| **Kysely** | `kysely` | typed schema plus migrator setup | Project-defined migrator; inspect `migrate` scripts. |
| **Sequelize** | `sequelize`, `sequelize-cli` | `.sequelizerc`, `models/`, `migrations/` | `sequelize-cli db:migrate` |
| **Raw SQL / pg** | `pg`, `mysql2`, `better-sqlite3` | hand-written `.sql` in `migrations/` | Project-specific runner; inspect scripts. |

## How to confirm

1. Read `package.json` dependencies for the names above.
2. Look for config files, schema files, and `migrations/`.
3. Use `migrations/` presence to infer generated migrations versus schema-push style.
4. Check `package.json` scripts for `migrate`, `db:*`, or `generate`.
5. Prefer the project's own script over direct CLI calls.
6. Run project scripts through the detected package manager.
7. Grep existing models and migrations to copy naming, column types, indexes, and rollback style.

## Principles

- Keep persistence shapes consistent with shared zod domain types.
- Let repositories map persistence rows to domain types.
- Prefer additive, reversible changes.
- Flag and confirm destructive changes.
- Match the repo's existing migration style exactly.
- Do not introduce a second migration mechanism.
- Never run migrations against non-dev databases without explicit user approval.
