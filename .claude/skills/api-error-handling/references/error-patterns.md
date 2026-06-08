# Error patterns

The kit's central handler in `src/apiApp.ts` already does the mapping. These
errors just carry the `statusCode` it reads. Do not add a second handler.

## Domain errors — `shared/lib/errors.ts`

```ts
// Each carries a numeric statusCode; the central errorHandler reads it.
export class HttpError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class BadRequestError   extends HttpError { constructor(m = "Bad Request")   { super(400, m); } }
export class UnauthorizedError extends HttpError { constructor(m = "Unauthorized")  { super(401, m); } }
export class ForbiddenError    extends HttpError { constructor(m = "Forbidden")     { super(403, m); } }
export class NotFoundError     extends HttpError { constructor(m = "Not Found")     { super(404, m); } }
export class ConflictError     extends HttpError { constructor(m = "Conflict")      { super(409, m); } }
```

Feature-specific errors live in the slice and extend these, e.g.
`class InvoiceNotFound extends NotFoundError`.

## Service throws (never touches req/res)

```ts
import { NotFoundError, ConflictError } from "../../shared/lib/errors";

async function get(id: string): Promise<Invoice> {
  const found = await repo.findById(id);
  if (!found) throw new NotFoundError(`Invoice ${id} not found`);
  return found;
}
```

## Route forwards with next(err)

```ts
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params); // ZodError → 400
    res.json(await service.get(id)); // NotFoundError → 404, all via the central handler
  } catch (err) {
    next(err); // never build an ad-hoc error response here
  }
});
```

## What the central handler already guarantees

```
ZodError                  → 400 { error: "Bad Request", issues }
err.statusCode in 400–599 → that status, message passed through for <500
no/!numeric statusCode    → 500 { error: "Internal Server Error" }  (message masked)
```

So an unexpected internal throw (no `statusCode`) stays a masked `500` — keep it
that way; do not attach `statusCode` to programming errors.

## Frontend mapping — map ApiError, don't render it raw

```tsx
import { ApiError } from "../../../shared/lib/api";

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) return "Please sign in to continue.";
    if (error.statusCode === 404) return "We couldn't find that.";
    if (error.statusCode >= 500) return "Something went wrong. Try again.";
  }
  return "Request failed.";
}

// in a component:
if (query.isError) return <p role="alert">{messageFor(query.error)}</p>;
```

For render-time throws, pair this with a route `ErrorBoundary` (see /react-router).

## Route status-code test

```ts
it("returns 404 for a missing invoice", async () => {
  const res = await request(app).get(`/api/invoices/${randomUuid()}`);
  expect(res.status).toBe(404);
});

it("masks internal errors as a bare 500", async () => {
  const res = await request(app).get("/api/invoices/boom"); // forces an unexpected throw
  expect(res.status).toBe(500);
  expect(JSON.stringify(res.body)).not.toMatch(/stack|sql|hash/i);
});
```

## Anti-patterns

- Do not add a second error-handling middleware; extend the central one via `statusCode`.
- Do not `res.status(...).json(...)` an error inside a route — `next(err)`.
- Do not attach `statusCode` to programming errors; let them stay masked `500`s.
- Do not render `ApiError.body` directly; map the status to a safe message.
