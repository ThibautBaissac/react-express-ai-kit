# Seed patterns

Adapt to detected tables and naming. Generic example seeds `users` and
`invoices`. Run via `db:seed` (`tsx scripts/seed.ts`).

## Idempotent entry — `scripts/seed.ts`

```ts
import { db } from "../src/shared/lib/db";
import { users } from "../src/features/user/user.table";
import { invoices } from "../src/features/invoice/invoice.table";

async function seed() {
  // Clear-then-insert keeps re-runs idempotent. Order matters for FKs:
  // delete children before parents, insert parents before children.
  db.delete(invoices).run();
  db.delete(users).run();

  // Stable ids so seed data is referenceable and re-runs are deterministic.
  const alice = { id: "11111111-1111-4111-8111-111111111111", email: "alice@example.com" };
  const bob = { id: "22222222-2222-4222-8222-222222222222", email: "bob@example.com" };

  db.insert(users).values([
    { ...alice, passwordHash: PLACEHOLDER_HASH },
    { ...bob, passwordHash: PLACEHOLDER_HASH },
  ]).run();

  // Security proof: each user owns their own invoice; cross-access must fail.
  // Empty state: bob deliberately has no invoices.
  db.insert(invoices).values([
    { id: "aaaa1111-1111-4111-8111-111111111111", ownerId: alice.id, customer: "Acme", amountCents: 1000, status: "sent" },
  ]).run();

  console.log(`Seeded: users=2, invoices=1 (bob left empty for empty-state proof)`);
}

seed();
```

## Upsert alternative (when you must preserve unrelated rows)

```ts
db.insert(users)
  .values(rows)
  .onConflictDoUpdate({ target: users.id, set: { email: sql`excluded.email` } })
  .run();
```

## Parse before insert

```ts
import { UserSchema } from "../src/features/user/user.schema";

const row = UserSchema.parse(candidate); // guard seed data against contract drift
db.insert(users).values(row).run();
```

## Idempotency check

```bash
pm_run db:migrate && pm_run db:seed && pm_run db:seed
# second run prints identical counts → idempotent
```

## Anti-patterns

- Do not append rows on each run without clearing or upserting — it drifts and breaks idempotency.
- Do not seed real secrets or production credentials.
- Do not bypass the schema; parse constructed records first.
- Do not put seeding logic in app code paths — it belongs in `scripts/seed.ts`.
