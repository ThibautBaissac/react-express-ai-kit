---
name: scaffold-authz
description: "Add CASL authorization to a feature: an isomorphic <feature>.ability.ts rule set the server and React share, server-side enforcement via attachAbility/authorize and per-record subject() checks, and <Can>/useAbility UI gating — built on the domain-free base in src/shared/authz/."
when_to_use: "Use WHEN gating actions by role or ownership, protecting a route or service with permission checks, hiding/disabling UI by permission, or adding per-record access rules — whether the user asks directly or an implementation agent is realizing a matching To-Do item from a `tasks/task-N.md` plan. Do NOT use for authentication (login/sessions/who-the-user-is — use /scaffold-auth), and do NOT define the API success/error shapes here (use /add-api-contract and /api-error-handling)."
argument-hint: "[feature]"
arguments: [feature]
model: sonnet
---

# Scaffold CASL authorization for a feature

Authorization answers "what may this principal do?". Authentication (who they
are, `req.user`) is a prerequisite owned by `/scaffold-auth`. The reusable base
already exists in `src/shared/authz/` — this skill wires a feature to it. Follow
`.claude/rules/authorization.md` throughout.

## Step 0 — Confirm prerequisites

- `@casl/ability` and `@casl/react` are installed (the base depends on them).
- A server-derived principal is available: auth middleware sets `req.user`
  (`{ id, roles? }`-compatible). If not, run `/scaffold-auth` first.
- The base files exist: `src/shared/authz/{ability.ts,authorize.ts,ability-context.tsx}`.

## Step 1 — Write the feature's ability rules

Create `src/features/$feature/$feature.ability.ts` exporting an
`AbilityContributor`. It is environment-neutral (no Express/React/DB imports) so
the server and the browser import the identical rules.

```ts
import type { AbilityContributor } from "../../shared/authz/ability";

export const ${feature}Abilities: AbilityContributor = (can, _cannot, user) => {
  can("read", "${Feature}");
  if (!user) return;
  can("create", "${Feature}");
  can("update", "${Feature}", { ownerId: user.id });
  can("delete", "${Feature}", { ownerId: user.id });
  if (user.roles?.includes("admin")) can("manage", "all");
};
```

Encode real rules from the spec, not a generic CRUD stub. Use a condition
(`{ ownerId: user.id }`) for ownership; omit it for type-level permissions.

## Step 2 — Enforce on the server

At the API composition root (`src/apiApp.ts` / `src/server.ts`), mount
`attachAbility` once after auth:

```ts
import { attachAbility } from "./shared/authz/authorize";
import { ${feature}Abilities } from "./features/$feature/$feature.ability";

const contributors = [${feature}Abilities /* , …other features */];
app.use(attachAbility((req) => req.user ?? null, contributors));
```

In feature route files, guard type-level actions:

```ts
import { authorize } from "../../shared/authz/authorize";

router.post("/$feature", authorize("create", "${Feature}"), create${Feature});
```

For per-record/ownership checks, pass `req.ability` into the service as an
`AppAbility`, load the record there, then check a tagged subject. This is also
where the 404-vs-403 existence-leakage decision lives (`/api-error-handling`):

```ts
import { subject, type AppAbility } from "../../shared/authz/ability";

export async function update${Feature}({
  ability,
}: {
  ability: AppAbility;
}) {
  const record = await repository.findById(id);

  if (!ability.can("update", subject("${Feature}", record))) {
    throw new ForbiddenError(); // or NotFoundError to hide existence
  }
}
```

Pass the ability into the service (e.g. as an argument) rather than `req` — keep
Express objects out of services.

## Step 3 — Gate the UI (UX only)

Build the same ability on the client and hide what the API would reject. This is
never a security boundary.

```tsx
// once, near the app root — contributors is a stable module-level constant
import { AbilityProvider } from "./shared/authz/ability-context";
const { data: user } = useCurrentUser();
<AbilityProvider user={user ?? null} contributors={contributors}>…</AbilityProvider>

// at a call site
import { Can } from "./shared/authz/ability-context";
<Can I="update" a="${Feature}"><EditButton /></Can>
```

## Step 4 — Test the boundary

Add colocated tests (`/write-tests`). Prove BOTH directions:

- Allowed: owner/admin can do the action.
- Denied: anonymous and non-owner are rejected (`403`, or `404` where existence
  is hidden). A green deny test is what proves the rule actually bites.

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_tests src/features/$feature
```

## Checklist

- [ ] `$feature.ability.ts` exports an `AbilityContributor`; no Express/React/DB imports.
- [ ] Rules read the server-derived principal, never a client-supplied id.
- [ ] Server enforces via `authorize` / `req.ability.can(subject(...))`.
- [ ] `<Can>`/`useAbility` only hide UI; the server still authorizes.
- [ ] Per-record checks tag the record with `subject(type, record)`.
- [ ] Deny-case tests exist and pass (403/404 per the existence-leakage decision).
