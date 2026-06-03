# ORM / data-layer detection

Identify the project's data layer before changing any schema. Detect — never assume.

## Signals by tool

| Tool | `package.json` dep | Config / schema files | Migration command (run via project script or `$PM_EXEC`) |
|---|---|---|---|
| **Prisma** | `prisma`, `@prisma/client` | `prisma/schema.prisma`, `prisma/migrations/` | `prisma migrate dev --name <x>` (dev), `prisma generate` |
| **Drizzle** | `drizzle-orm`, `drizzle-kit` | `drizzle.config.ts`, `*.schema.ts`, `drizzle/` | `drizzle-kit generate` then `drizzle-kit migrate` |
| **Mongoose** | `mongoose` | `*.model.ts` with `new Schema({...})` | no migration framework by default; schema is code (consider `migrate-mongo` if present) |
| **TypeORM** | `typeorm` | `ormconfig.*`, `*.entity.ts`, `@Entity()` | `typeorm migration:generate` / `migration:run` |
| **Knex** | `knex` | `knexfile.{ts,js}`, `migrations/` | `knex migrate:make <x>` then `knex migrate:latest` |
| **Kysely** | `kysely` | typed schema + a migrator setup | project-defined migrator (look for a `migrate` script) |
| **Sequelize** | `sequelize`, `sequelize-cli` | `.sequelizerc`, `models/`, `migrations/` | `sequelize-cli db:migrate` |
| **Raw SQL / pg** | `pg`, `mysql2`, `better-sqlite3` | hand-written `.sql` in `migrations/` | project-specific runner; inspect scripts |

## How to confirm

1. Read `package.json` dependencies for the names above.
2. Look for the config/schema files; the presence of a `migrations/` dir tells you the
   workflow style (generated migrations vs schema-push).
3. Check `package.json` scripts for a `migrate`/`db:*`/`generate` script — **prefer the
   project's own script** over calling the CLI directly, and run it via the detected
   package manager.
4. Grep an existing model/migration to copy naming, column-type, and index conventions.

## Principles regardless of tool

- Keep the persistence shape consistent with the shared zod domain type; the repository
  maps between them.
- Prefer additive, reversible changes. Flag and confirm anything destructive.
- Match the repo's existing migration style exactly; don't introduce a second mechanism.
- Never run a migration against a non-dev database without explicit user approval.
