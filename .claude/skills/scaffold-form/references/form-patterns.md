# Form patterns

React Hook Form + `zodResolver`, validated against the **feature's API request
contract** so the form and the boundary share one schema.

## Where it lives

Keep the domain form in its feature (`features/<feature>/components/` or
`forms/`). Keep generic, domain-free field primitives (`Field`, `Input`,
`FormError`, `Select`) in `shared/ui`. The form imports the request schema from
the feature contract — never redefine it.

## Resolve against the contract schema

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CreateInvoiceBody } from "../invoice.schema";

type Values = z.infer<typeof CreateInvoiceBody>;

export function CreateInvoiceForm() {
  const { mutate, isPending, error } = useCreateInvoice();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(CreateInvoiceBody),
    defaultValues: { customer: "", amount: 0 }, // schema-shaped
  });

  const onSubmit = handleSubmit((values) =>
    mutate(values, {
      onError: (e) => applyServerErrors(e, setError),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field label="Customer" error={errors.customer?.message}>
        <input
          {...register("customer")}
          aria-invalid={!!errors.customer}
          aria-describedby={errors.customer ? "customer-error" : undefined}
        />
      </Field>
      {error && <FormError>{toMessage(error)}</FormError>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Create"}
      </button>
    </form>
  );
}
```

## Edit forms: defaults from typed data

Seed `defaultValues` from already-parsed server data; reset when it changes.

```tsx
const { data } = useInvoice(id);            // parsed by the Query hook
const form = useForm<Values>({
  resolver: zodResolver(UpdateInvoiceBody),
  defaultValues: data,
});
useEffect(() => { if (data) form.reset(data); }, [data, form]);
```

## Map server failures back to fields

The API parses with the same contract, so a 400 can carry field paths. Map them
to `setError`; fall back to a form-level message.

```ts
function applyServerErrors(err: unknown, setError: UseFormSetError<Values>) {
  const parsed = ApiError.safeParse(err);     // contract for error shape
  if (parsed.success && parsed.data.fields) {
    for (const [name, message] of Object.entries(parsed.data.fields)) {
      setError(name as keyof Values, { message });
    }
    return;
  }
  setError("root", { message: "Something went wrong. Try again." });
}
```

## Coercion at the input edge

Inputs yield strings. Coerce in the schema (`z.coerce.number()`) or with
`register("amount", { valueAsNumber: true })` — not with manual parsing in the
submit handler.

## Interactive controls use Headless UI

For selects, comboboxes, and switches, wrap a Headless UI primitive with
`Controller` so RHF owns the value and Headless UI owns keyboard/focus/ARIA.

```tsx
<Controller
  control={control}
  name="status"
  render={({ field }) => (
    <Listbox value={field.value} onChange={field.onChange}>{/* … */}</Listbox>
  )}
/>
```

## Testing

Use React Testing Library + `userEvent`. Mock the mutation hook; assert that
submit calls it with parsed values, that field errors render on invalid input,
and that submit is disabled while pending. See the `write-tests` skill for the
Query/hook mocking patterns.

## Anti-patterns

- A second zod schema or `interface` for the form — reuse the request contract.
- `fetch`/`api` calls or `invalidateQueries` inside the form — that is the
  mutation hook's job.
- Business rules in the resolver (`.refine` cross-entity checks) — services own them.
- Mirroring server state into form state beyond initial `defaultValues`.
- Hand-rolled ARIA on a control Headless UI already provides.
