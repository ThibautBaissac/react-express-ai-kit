---
paths:
  - "**/routes/**/*.ts"
  - "**/controllers/**/*.ts"
  - "**/*.route.ts"
  - "**/*.controller.ts"
---

# Express routes / controllers — keep handlers thin

A handler does three things only: **parse input → call a service → shape the HTTP
response**. No business logic, no data access.

## Parse at the boundary, then trust the type

```ts
// ✅ thin handler
router.post("/invoices", async (req, res, next) => {
  try {
    const body = CreateInvoiceBody.parse(req.body); // unknown → typed
    const invoice = await invoiceService.create(body);
    res.status(201).json(invoice);
  } catch (err) {
    next(err); // delegate to centralized error middleware
  }
});
```

```ts
// ❌ logic + data access leaking into the handler
router.post("/invoices", async (req, res) => {
  if (req.body.amountCents < 0) return res.status(400).send("bad");
  const row = await db.invoice.create({ data: req.body }); // DB in route
  await mailer.send(/* ... */);                            // business logic
  res.json(row);
});
```

## Rules

- Validate `req.body`/`params`/`query` with the shared zod schema. Never read raw
  `req.body.x` without parsing.
- No `any` on `req`/`res`. Type parsed values from the schema.
- Don't catch-and-swallow: forward errors to the centralized error middleware via
  `next(err)` (or an async wrapper). Map domain errors → HTTP status there, not inline.
- A handler stays small enough to read at a glance. If it grows branches, the logic
  belongs in the service.

## Checklist
- [ ] Input parsed with a shared zod schema at the top of the handler.
- [ ] No DB/ORM calls and no business rules in the handler.
- [ ] Errors forwarded to centralized middleware, not handled ad hoc.
- [ ] No `any` on request/response; parsed values are typed.
