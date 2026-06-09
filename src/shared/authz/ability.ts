import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";

// Generic, domain-free CASL base. The same ability runs on the Express server
// and in the React bundle (CASL is isomorphic), so this module stays
// environment-neutral: no Express, React, or DB imports. Each feature
// contributes its own rules through an `AbilityContributor`; this layer never
// names a domain subject.

// CRUD + `manage`. The `(string & {})` keeps the literals for autocomplete
// while staying open, so a feature can use its own action without editing
// shared.
export type Action =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | (string & {});

// `"all"` matches every subject. Features pass their own subject-type strings
// (e.g. "Invoice"), tagging records with `subject()` for per-record checks.
export type Subject = "all" | (string & {});

// Open by design: a domain-free base cannot pin a closed subject union, so
// actions/subjects stay strings and conditions stay open `MongoQuery`. An app
// wanting stricter typing can declare its own `MongoAbility<[Action, Subject]>`
// — contributors keep working because the builder accepts strings.
export type AppAbility = MongoAbility;

// The server-derived identity an ability is built for. `null` means anonymous.
// A feature's richer user type is assignable to this as long as it has `id`.
export interface Principal {
  id: string;
  roles?: readonly string[];
}

// A feature contributes its rules by calling `can`/`cannot`. It must stay
// environment-neutral so the identical function runs on both sides of the wire.
export type AbilityContributor = (
  can: AbilityBuilder<AppAbility>["can"],
  cannot: AbilityBuilder<AppAbility>["cannot"],
  user: Principal | null,
) => void;

// Compose every feature's rules into one ability for the given principal. The
// composition root (server middleware / React provider) owns the contributor
// list, so `shared/` never imports a feature.
export function defineAbilityFor(
  user: Principal | null,
  contributors: readonly AbilityContributor[],
): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  for (const contribute of contributors) {
    contribute(builder.can, builder.cannot, user);
  }
  return builder.build();
}

// Tag a plain record with its subject type for per-record checks, e.g.
// `ability.can("update", subject("Invoice", invoice))`. Without this, CASL
// cannot tell a DB row's type apart and condition rules never match.
export { subject } from "@casl/ability";
