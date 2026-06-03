# Zod contract patterns

## Where it lives

Shared schemas must be importable by both the browser bundle and Node. Put them in the
monorepo shared package, or an environment-neutral dir (`src/shared`, `src/contracts`).
No Express, React, or DB-client imports in these files.

## Parse, don't validate

Convert `unknown` into a typed value at the boundary, then trust the type.

```ts
// ✅ returns a typed value or throws
const body = CreateUserBody.parse(req.body);
// ✅ non-throwing variant when you want to branch
const result = CreateUserBody.safeParse(req.body);
if (!result.success) return next(new BadRequestError(result.error));
```

## Schema first, type derived

```ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
  age: z.number().int().min(0).optional(),
});
export type User = z.infer<typeof UserSchema>;   // ✅ derived
// ❌ never: export interface User { id: string; ... }
```

## Derive variants instead of repeating

```ts
export const CreateUserBody = UserSchema.omit({ id: true });        // input
export const UpdateUserBody = CreateUserBody.partial();             // PATCH
export const PublicUser     = UserSchema.omit({ /* secrets */ });   // response
export const UserListResponse = z.object({ items: z.array(UserSchema) });
```

## Branded types for identifiers (optional, when mix-ups have bitten you)

```ts
export const UserId = z.string().uuid().brand<"UserId">();
export type UserId = z.infer<typeof UserId>; // not assignable from a plain string
```

## Coercion for query params (strings in, typed out)

```ts
export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

## Reusable Express validation middleware (if the project wants one)

```ts
import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) return next(r.error);   // centralized error mw → 400
    req.body = r.data;                       // hand typed data downstream
    next();
  };
```

## Anti-patterns
- A separate `interface` mirroring the schema (drifts immediately).
- Validating only on one side of the boundary.
- Putting business rules in `.refine()` that belong in the service (keep schemas about
  shape/format; cross-entity rules live in the service).
