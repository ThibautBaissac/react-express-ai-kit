# Zod contract patterns

## Where it lives

Shared schemas must work in both the browser bundle and Node.
Use the monorepo shared package, or use an environment-neutral directory such as `src/shared` or `src/contracts`.
Do not import Express, React, DB clients, or runtime-specific modules here.

## Parse, don't validate

Convert `unknown` into typed data at the boundary, then trust the type.

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

## Branded types for identifiers

Use branded ids only when plain strings have caused real mix-ups.

```ts
export const UserId = z.string().uuid().brand<"UserId">();
export type UserId = z.infer<typeof UserId>; // not assignable from a plain string
```

## Coercion for query params

Query params arrive as strings, so coerce them at the boundary.

```ts
export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

## Reusable Express validation middleware

Use middleware only when the project already wants that pattern.

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

- Do not mirror a schema with a separate `interface`; it drifts.
- Do not validate only one side of the FE/BE boundary.
- Do not put cross-entity business rules in `.refine()`; services own those rules.
