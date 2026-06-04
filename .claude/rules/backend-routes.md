---
paths:
  - "**/routes/**/*.ts"
  - "**/controllers/**/*.ts"
  - "**/*.route.ts"
  - "**/*.routes.ts"
  - "**/*.controller.ts"
---

# Express routes — thin handlers

A handler parses input, calls a service, and shapes the response. No business
logic or data access.

## Parse at the boundary

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
// ❌ logic and data access leak into the handler
router.post("/invoices", async (req, res) => {
  if (req.body.amountCents < 0) return res.status(400).send("bad");
  const row = await db.invoice.create({ data: req.body }); // DB in route
  await mailer.send(/* ... */);                            // business logic
  res.json(row);
});
```

## Rules

- Parse `req.body`, `req.params`, and `req.query` with FE/BE contract schemas.
- Never read raw `req.body.x` before parsing.
- Do not use `any` on request or response objects.
- Forward errors to centralized middleware with `next(err)` or an async wrapper.
- Map domain errors to HTTP status in error middleware, not inline.
- Move branching business logic into the service.

## Checklist

- [ ] Input is parsed with a FE/BE contract schema at the top.
- [ ] Handler calls a service and shapes the response.
- [ ] Handler has no DB or ORM calls.
- [ ] Handler has no business rules.
- [ ] Errors go to centralized middleware.
- [ ] Parsed values carry the types.
