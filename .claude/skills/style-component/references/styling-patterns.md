# Tailwind v4 + Headless UI patterns

Reference for the `style-component` skill. Versions current as of June 2026: Tailwind CSS v4.x, `@headlessui/react` v2.2.x.

## Tailwind v4 setup (Vite)

v4 is CSS-first: no `postcss.config.js`, no `tailwind.config.js`, automatic content detection.

1. Install `tailwindcss` and `@tailwindcss/vite` as dev dependencies with the project's package manager (`npm i -D …`, `pnpm add -D …`, or `yarn add -D …` — match the lockfile).

2. Add the plugin in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

3. Import Tailwind in your CSS entry (e.g. `src/index.css`):

```css
@import "tailwindcss";
```

That's the whole setup. Do **not** add `@tailwind base/components/utilities` (that's v3) or scaffold a `tailwind.config.js` — only edit one if the repo already has it.

## Customize with `@theme`, not JS config

Design tokens live in CSS and become utilities automatically.

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.62 0.19 256);
  --font-display: "Inter", sans-serif;
  --spacing-gutter: 1.5rem;
}
```

`--color-brand` → `bg-brand text-brand`; `--spacing-gutter` → `p-gutter`. Reference tokens before reaching for arbitrary values.

## Utility conventions

```tsx
// ❌ string concatenation, arbitrary values when a token exists
<button className={"px-[16px] " + (active ? "bg-[#2563eb]" : "")}>

// ✅ token utilities + conditional helper
import clsx from "clsx";
<button className={clsx("px-4 py-2 rounded-md font-medium", active && "bg-brand text-white")}>
```

- Prefer tokens (`p-4`, `text-brand`) over arbitrary values (`p-[17px]`).
- Use the project's existing `clsx`/`cn` helper for conditional classes; add one only if none exists.
- Keep variants inline: `hover:`, `focus-visible:`, `md:`, `dark:`, `data-[state=open]:`.
- Reach for `@apply` only to dedupe a cluster reused 3+ times; prefer a small component over a CSS class.

## Headless UI primitives

Install `@headlessui/react` only when needed. Before hand-rolling an interactive widget or form control, check whether one of these documented component families provides the behavior. You own the Tailwind classes; Headless UI owns the keyboard, focus, and ARIA behavior.

| Category | Need | Component family |
| --- | --- | --- |
| Interactive | Dropdown menu | `Menu` |
| Interactive | Accordion / collapsible section | `Disclosure` |
| Interactive | Modal / dialog | `Dialog` |
| Interactive | Popover | `Popover` |
| Interactive | Tabs | `TabGroup` |
| Interactive | Animation | `Transition` / the `transition` prop |
| Form | Button | `Button` |
| Form | Checkbox | `Checkbox` |
| Form | Typeahead select | `Combobox` |
| Form | Group related fields | `Fieldset` |
| Form | Text input | `Input` |
| Form | Custom select | `Listbox` |
| Form | Radio options | `RadioGroup` |
| Form | Native select | `Select` |
| Form | Toggle | `Switch` |
| Form | Multiline text input | `Textarea` |

Consult the relevant Headless UI documentation for the family's nested components and API, such as `MenuButton`/`MenuItems`/`MenuItem` or `DialogPanel`/`DialogTitle`.

### Style states with the data-attribute API (v2.1+)

Render props still work, but the data-attribute API keeps markup flat and styling in Tailwind:

```tsx
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import clsx from "clsx";

export function ActionsMenu({ onRename }: { onRename: () => void }) {
  return (
    <Menu>
      <MenuButton className="rounded-md px-3 py-2 hover:bg-gray-100">Actions</MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className={clsx(
          "w-48 rounded-md border bg-white p-1 shadow-lg",
          "transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
        )}
      >
        <MenuItem>
          <button
            onClick={onRename}
            className="w-full rounded px-2 py-1.5 text-left data-[focus]:bg-brand data-[focus]:text-white"
          >
            Rename
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
```

Common state attributes: `data-[open]`, `data-[closed]`, `data-[selected]`, `data-[active]`, `data-[focus]`, `data-[disabled]`, `data-[checked]`.

### Transitions

Add the `transition` prop (or wrap in `<Transition>`) and express enter/leave with `data-[closed]:` / `data-[enter]:` / `data-[leave]:` utilities — no separate transition-class props.

## Accessibility & layering reminders

- Let Headless UI manage focus traps, `aria-*`, and keyboard nav — don't re-add them.
- Always give `Dialog` a `DialogTitle` (or `aria-label`) for screen readers.
- Keep these components presentational: data comes from props/hooks, not `fetch`/`useQuery`.
- Server state stays in TanStack Query; UI-only flags (open/closed) may use local state or Zustand.
