---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript conventions

These rules apply to every `.ts` and `.tsx` file.
Assume `strict: true`.

## Avoid unsafe escapes

`any` disables type checking and spreads silently.
Use `unknown` at boundaries, then narrow or parse.
Define real types for known data.

```ts
// ❌ defeats the type system
function handle(payload: any) { return payload.id; }

// ✅ accept unknown, parse into a type
function handle(payload: unknown) {
  const { id } = EventSchema.parse(payload);
  return id;
}
```

Avoid casts except at unavoidable boundaries.
Never use `as any` or `as unknown as T`.

## Infer locals

Let TypeScript infer locals and simple return types.
Annotate exported function signatures and public contracts.

```ts
// ❌ noisy and drift-prone
const items: Array<{ id: string }> = data.map((d): { id: string } => ({ id: d.id }));
// ✅
const items = data.map((d) => ({ id: d.id }));
```

## Model states with unions

Use discriminated unions so illegal states cannot compile.
Avoid optional flags that must agree.

```ts
// ❌ which fields are valid when?
type Result = { ok: boolean; data?: User; error?: string };
// ✅
type Result =
  | { ok: true; data: User }
  | { ok: false; error: string };
```

## Make switches exhaustive

Use a `never` default so new variants create compile errors.

```ts
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.size ** 2;
    default: { const _exhaustive: never = s; return _exhaustive; }
  }
}
```

## Prefer type unions

Use `type` and union literals for data contracts.
Prefer `as const` object maps or string-literal unions over TypeScript `enum`.

## Checklist

- [ ] No `any`.
- [ ] No `as any` or double casts.
- [ ] Exported APIs have explicit contracts.
- [ ] Optional-flag state is modeled as a discriminated union.
- [ ] Union switches are exhaustive.
- [ ] Boundaries take `unknown` and parse.
