# Security review checklist (Express + React + TypeScript)

Detailed companion to the `security-reviewer` agent. Check each item the diff touches;
skip categories the change doesn't reach.

## Input validation (boundary)
- [ ] Every `req.body` / `req.params` / `req.query` is zod-parsed before use.
- [ ] Numeric/enum/length constraints encoded in the schema (not just `z.string()`).
- [ ] File uploads bounded (size, type) and stored safely.
- [ ] Webhook/3rd-party payloads validated and signature-verified where applicable.

## Authentication & authorization
- [ ] Protected routes require auth (middleware actually applied, not just defined).
- [ ] Authorization checks object ownership; resource IDs scoped to the authenticated
      user (no IDOR). User identity comes from the session/token, never the request body.
- [ ] Role/permission checks happen server-side, not only hidden in the UI.
- [ ] Session/JWT: reasonable expiry, verified signature, no `alg: none`.

## Injection & unsafe execution
- [ ] DB access uses parameterized queries / the ORM's safe API — no string concatenation.
- [ ] No `eval`, `Function(...)`, or `child_process` with interpolated user input.
- [ ] No unsafe dynamic `require`/`import` from user input.

## Secrets
- [ ] No hardcoded credentials, API keys, or tokens in source.
- [ ] Secrets read from environment/secret store; `.env` not committed.
- [ ] Secrets never logged or included in responses/error payloads.

## XSS & rendering
- [ ] `dangerouslySetInnerHTML` avoided, or input sanitized (e.g. DOMPurify).
- [ ] User content rendered as text by default; URLs validated before use in `href`/`src`.

## Transport, CORS, cookies, headers
- [ ] CORS not `origin: *` together with `credentials: true`; allowlist real origins.
- [ ] Security headers set (helmet or equivalent).
- [ ] Auth cookies `httpOnly`, `secure`, `sameSite`; CSRF protection for cookie auth.

## Error handling & leakage
- [ ] Centralized error middleware; no stack traces/internal details to clients.
- [ ] Auth failures return generic messages (no user-enumeration).

## Availability & abuse
- [ ] Rate limiting on auth and other sensitive/expensive endpoints.
- [ ] Payload size limits configured.
- [ ] No SSRF: user-supplied URLs validated/allowlisted before server-side fetch.
- [ ] No open redirects (redirect targets validated).
