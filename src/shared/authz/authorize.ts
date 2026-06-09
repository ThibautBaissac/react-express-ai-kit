import type { NextFunction, Request, Response } from "express";
import {
  defineAbilityFor,
  type AbilityContributor,
  type Action,
  type AppAbility,
  type Principal,
  type Subject,
} from "./ability";

// Server-side authorization. Authentication (who the user is) is owned by the
// auth slice and sets `req.user`; this layer only derives and enforces
// permissions. Keep the two concerns separate.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // Built per request by `attachAbility`. `req.user` itself is owned and
      // typed by the auth slice, so it is intentionally not augmented here.
      ability?: AppAbility;
    }
  }
}

// Carries a 403 the central error handler maps automatically (it keys off
// `statusCode`). Mirrors the kit's domain-error convention; see
// `/api-error-handling`.
export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// Build `req.ability` from the server-derived principal. Mount AFTER the auth
// middleware that sets `req.user`, and BEFORE any `authorize()` guard.
// `getPrincipal` extracts the principal from the request, decoupling this layer
// from how the auth slice types `req.user`.
export function attachAbility(
  getPrincipal: (req: Request) => Principal | null,
  contributors: readonly AbilityContributor[],
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.ability = defineAbilityFor(getPrincipal(req), contributors);
    next();
  };
}

// Route guard for type-level checks ("can this principal create invoices at
// all?"). For per-record ownership, pass `req.ability` into the service as an
// `AppAbility`, then check `ability.can(action, subject("Invoice", record))`
// after loading the record. That is where existence-leakage decisions (404 vs
// 403) also live.
export function authorize(action: Action, subjectType: Subject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.ability?.can(action, subjectType)) {
      return next();
    }
    next(new ForbiddenError());
  };
}
