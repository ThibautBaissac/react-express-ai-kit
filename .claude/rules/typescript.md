---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript conventions

Applies to every `.ts`/`.tsx` file. Assumes `strict: true`.

## No `any`, no unsafe escapes

`any` disables type checking and spreads silently. Use `unknown` at boundaries and
narrow, or define a real type.

```ts
// ❌ defeats the type system
function handle(payload: any) { return payload.id; }

// ✅ accept unknown, parse into a type
function handle(payload: unknown) {
  const { id } = EventSchema.parse(payload);
  return id;
}
```

Avoid `as` casts except for genuinely unavoidable boundaries; never `as any` or `as unknown as T`.

## Infer, don't restate

Let TypeScript infer locals and return types of simple functions. Annotate exported
function signatures and public contracts.

```ts
// ❌ noisy and drift-prone
const items: Array<{ id: string }> = data.map((d): { id: string } => ({ id: d.id }));
// ✅
const items = data.map((d) => ({ id: d.id }));
```

## Model states with discriminated unions

Make illegal states unrepresentable instead of carrying optional flags that must agree.

```ts
// ❌ which fields are valid when?
type Result = { ok: boolean; data?: User; error?: string };
// ✅
type Result =
  | { ok: true; data: User }
  | { ok: false; error: string };
```

## Exhaustive switches

Use a `never` default so adding a variant becomes a compile error.

```ts
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.size ** 2;
    default: { const _exhaustive: never = s; return _exhaustive; }
  }
}
```

## Prefer `type` for contracts; avoid `enum`

Use `type`/union literals for data contracts (better inference, zod-friendly). Prefer
`as const` object maps or string-literal unions over TS `enum`.

## Checklist
- [ ] No `any` and no `as any` / double casts.
- [ ] Return types inferred for trivial fns; annotated for exported APIs.
- [ ] Optional-flag soup replaced by discriminated unions.
- [ ] Switches over unions are exhaustive (`never` guard).
- [ ] Boundaries take `unknown` and parse.
