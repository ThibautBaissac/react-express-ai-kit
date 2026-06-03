# Security review checklist

Use this with the `security-reviewer` agent.
Check only categories the diff or surrounding context touches.

## Input validation

- [ ] Every `req.body`, `req.params`, and `req.query` value is zod-parsed before use.
- [ ] Headers, webhooks, file metadata, and third-party payloads are parsed before use.
- [ ] Numeric, enum, length, uuid, URL, and format constraints live in schemas.
- [ ] File uploads have size, type, and storage controls.
- [ ] Webhooks verify signatures where the provider supports them.

## Authentication and authorization

- [ ] Protected routes actually apply auth middleware.
- [ ] Object-level authorization checks ownership or permissions.
- [ ] Resource IDs are scoped to the authenticated user.
- [ ] User identity comes from the session or token, not the request body.
- [ ] Role and permission checks happen server-side.
- [ ] Session and JWT expiry are reasonable.
- [ ] JWT signatures are verified and `alg: none` is impossible.

## Injection and unsafe execution

- [ ] DB access uses parameterized queries or safe ORM APIs.
- [ ] SQL, NoSQL, and search queries are not built by string concatenation.
- [ ] No `eval`, `Function(...)`, or unsafe dynamic code execution.
- [ ] No `child_process` command uses interpolated user input.
- [ ] No unsafe dynamic `require` or `import` from user input.

## Secrets

- [ ] No hardcoded credentials, API keys, passwords, or tokens.
- [ ] Secrets come from env or a secret store.
- [ ] `.env` files are not committed.
- [ ] Secrets are not logged.
- [ ] Secrets are not returned in responses or error payloads.

## XSS and rendering

- [ ] `dangerouslySetInnerHTML` is avoided or sanitized with a trusted sanitizer.
- [ ] User content renders as text by default.
- [ ] User-controlled URLs are validated before use in `href` or `src`.
- [ ] Redirect targets are validated.

## Transport, CORS, cookies, and headers

- [ ] CORS does not combine `origin: *` with `credentials: true`.
- [ ] CORS uses an allowlist for credentialed requests.
- [ ] Security headers are set with helmet or equivalent.
- [ ] Auth cookies use `httpOnly`, `secure`, and `sameSite`.
- [ ] Cookie auth has CSRF protection.

## Error handling and leakage

- [ ] Centralized error middleware handles API errors.
- [ ] Client responses do not include stack traces or internal details.
- [ ] Auth failures use generic messages.
- [ ] Logs include enough diagnostic context without secrets.

## Availability and abuse

- [ ] Auth routes and expensive endpoints have rate limits.
- [ ] Payload size limits are configured.
- [ ] Server-side fetches validate or allowlist user-supplied URLs.
- [ ] Open redirects are blocked.
- [ ] Expensive list endpoints have pagination or limits.
