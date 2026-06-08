# Auth patterns

Adapt to detected layout and naming. Generic example uses a `user` slice. Never
log, return, or hardcode plaintext passwords or secrets.

## Contract — `user.schema.ts`

```ts
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

// Public DTO — what may leave the server. Secrets omitted.
export const PublicUser = UserSchema.omit({ passwordHash: true });
export type PublicUser = z.infer<typeof PublicUser>;

export const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
export type SignupBody = z.infer<typeof SignupBody>;

export const LoginBody = SignupBody;
export type LoginBody = z.infer<typeof LoginBody>;
```

## Service — hash on signup, verify on login

```ts
import argon2 from "argon2"; // or bcrypt; install only what's missing
import { UnauthorizedError } from "../../shared/lib/errors"; // see /api-error-handling
import type { UserRepository } from "./user.repository";
import { PublicUser, type LoginBody, type SignupBody } from "./user.schema";

export function createUserService(repo: UserRepository) {
  return {
    async signup(input: SignupBody): Promise<PublicUser> {
      const passwordHash = await argon2.hash(input.password);
      const user = await repo.insert({ email: input.email, passwordHash });
      return PublicUser.parse(user); // never return the hash
    },
    async verifyCredentials(input: LoginBody): Promise<PublicUser> {
      const user = await repo.findByEmail(input.email);
      // Verify even when the user is missing to limit timing/enumeration signals.
      const ok = user
        ? await argon2.verify(user.passwordHash, input.password)
        : await argon2.verify(DUMMY_HASH, input.password).catch(() => false);
      if (!user || !ok) throw new UnauthorizedError("Invalid credentials");
      return PublicUser.parse(user);
    },
  };
}
```

## Middleware — derive the principal server-side

```ts
import type { RequestHandler } from "express";
import { UnauthorizedError } from "../../shared/lib/errors";

// Augment Express once (e.g. in a types file): req.user is the trusted principal.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export const requireAuth =
  (resolve: (req: import("express").Request) => Promise<{ id: string; email: string } | null>): RequestHandler =>
  async (req, _res, next) => {
    try {
      // session: read a signed cookie exposed by cookie-parser/cookie-session/express-session;
      // token: read Authorization: Bearer <jwt>
      const principal = await resolve(req);
      if (!principal) throw new UnauthorizedError("Not authenticated");
      req.user = principal; // downstream trusts this, never req.body/params
      next();
    } catch (err) {
      next(err);
    }
  };
```

## Authorization — ownership without existence leakage

```ts
import { NotFoundError, ForbiddenError } from "../../shared/lib/errors";

async function getOwnedInvoice(service, principalId: string, id: string) {
  const invoice = await service.findById(id);
  // Hide existence: a resource you don't own looks the same as one that's absent.
  if (!invoice || invoice.ownerId !== principalId) throw new NotFoundError("Invoice not found");
  // If the specs prefer an explicit 403 over hiding existence, throw ForbiddenError instead.
  return invoice;
}
```

## Routes — `auth.routes.ts`

```ts
import { Router } from "express";
import { LoginBody, SignupBody } from "./user.schema";
import type { UserService } from "./user.service";

export function authRoutes(service: UserService): Router {
  const router = Router();

  router.post("/signup", async (req, res, next) => {
    try {
      const body = SignupBody.parse(req.body);
      const user = await service.signup(body);
      // issue the signed httpOnly session cookie or token here
      res.status(201).json(user);
    } catch (err) { next(err); }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const user = await service.verifyCredentials(LoginBody.parse(req.body));
      res.json(user);
    } catch (err) { next(err); }
  });

  router.get("/me", /* requireAuth */ async (req, res) => {
    res.json(req.user ?? null);
  });

  return router;
}
```

For session mode, wire the chosen middleware on the app before these routes. A
minimal same-origin setup uses `cookie-parser` with `env.AUTH_SESSION_SECRET`,
then sets a signed, `httpOnly`, same-site cookie containing an opaque session id
that the server resolves to a user. Do not put the user id in a client-controlled
body, query param, or unsigned cookie and treat it as trusted.

## Frontend — query owns auth state, router guards

```tsx
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router";
import { PublicUser } from "../user.schema";
import { api } from "../../../shared/lib/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const data = await api.get("/auth/me");
      return data ? PublicUser.parse(data) : null;
    },
  });
}

export function RequireAuth() {
  const { data, isLoading } = useCurrentUser();
  if (isLoading) return <p>Loading…</p>;
  return data ? <Outlet /> : <Navigate to="/login" replace />;
}
```

## Negative-case tests

```ts
it("rejects a wrong password", async () => {
  const service = createUserService(repoWith(existingUser));
  await expect(service.verifyCredentials({ email: existingUser.email, password: "wrong" }))
    .rejects.toBeInstanceOf(UnauthorizedError);
});

it("never returns the password hash", async () => {
  const service = createUserService(repoWith(existingUser));
  const me = await service.signup({ email: "a@b.co", password: "longenough" });
  expect(me).not.toHaveProperty("passwordHash");
});
```

Route-level proof (supertest-style when the project has it): `401` when
unauthenticated, `404`/`403` for a foreign id per the existence-leakage decision.

## Anti-patterns

- Do not authorize from `req.body`/`params`/`query` ids — only from `req.user`.
- Do not return or log `passwordHash`, salts, secrets, or session tokens.
- Do not mirror auth state into Zustand; TanStack Query owns it.
- Do not invent a bespoke crypto scheme; use the hasher's verify.
