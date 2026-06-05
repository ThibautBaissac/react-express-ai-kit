---
paths:
  - "**/forms/**/*.tsx"
  - "**/*.form.tsx"
  - "**/*Form.tsx"
---

# Forms — React Hook Form over the shared contract

Forms collect input with React Hook Form and validate against the **same zod
contract the API uses**. The form owns input state; a mutation hook owns
submission; the service owns business rules.

## Validate with the contract schema, not a parallel one

Resolve against the feature's existing request schema (`CreateInvoiceBody`,
`UpdateInvoiceBody`). Never hand-write a second schema or an `interface` for the
form — it drifts from the boundary.

```tsx
// ❌ a second schema just for the form — drifts from the API contract
const formSchema = z.object({ amount: z.number(), customer: z.string() });
const { register } = useForm({ resolver: zodResolver(formSchema) });

// ✅ reuse the contract; values are z.infer of the same schema
import { CreateInvoiceBody } from "../invoice.schema";
const { register, handleSubmit, formState: { errors } } =
  useForm<z.infer<typeof CreateInvoiceBody>>({
    resolver: zodResolver(CreateInvoiceBody),
  });
```

## Submit through a mutation hook, never fetch in the form

The component renders and calls a TanStack Query mutation. No `fetch`/`api`
calls, no query invalidation, and no business logic inside the form.

```tsx
// ❌ fetching and cache logic inside the form component
async function onSubmit(values) {
  await api.post("/invoices", values);
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
}

// ✅ the mutation hook owns the write + invalidation
const { mutate, isPending } = useCreateInvoice();
const onSubmit = handleSubmit((values) => mutate(values));
```

## Surface errors; keep inputs accessible

- Render field errors from `formState.errors`; tie them to inputs with
  `aria-invalid` and `aria-describedby`.
- Map server-side failures (a 400 from the contract, a 409 conflict) back onto
  fields with `setError`, or to a form-level message — do not swallow them.
- Disable submit while `isPending`; do not roll your own loading flag.
- Use Headless UI for interactive controls (listbox, combobox, switch); let it
  own keyboard, focus, and ARIA.

## Rules

- One source of truth: the form schema **is** the request contract schema.
- The form is presentational + input state only; data and writes come via hooks.
- Derive default values from typed data, not untyped literals.
- Keep generic field primitives (`Field`, `Input`, `FormError`) in `shared/ui`;
  keep domain forms in their feature.
- Do not put cross-entity business rules in the resolver — services own those.
- Do not mirror server state into form state beyond initial defaults.

## Checklist

- [ ] Resolver uses the feature's existing zod request schema, not a new one.
- [ ] Form values are `z.infer` of that schema; no parallel `interface`.
- [ ] Submission goes through a `useMutation` hook; no `fetch` in the component.
- [ ] Field and server errors are surfaced and tied to inputs accessibly.
- [ ] Submit is disabled via the mutation's `isPending`.
- [ ] Generic field primitives live in `shared/ui`; domain forms stay in the feature.
