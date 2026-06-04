---
name: style-component
description: "Style React UI with Tailwind CSS v4 utilities and Headless UI accessible primitives, wired into presentational components without breaking one-way layering."
when_to_use: "Use WHEN styling or restyling a component, building a dialog/menu/combobox/listbox/popover/tabs/switch/disclosure, adding transitions, or setting up Tailwind. Do NOT use to fetch data or add business logic (that lives in hooks/services), and do NOT use for backend work."
argument-hint: "[component-or-feature]"
arguments: [target]
model: sonnet
---

# Style a component with Tailwind + Headless UI

Style the UI for `$target` with utility classes, and reach for Headless UI whenever the element is interactive and needs accessibility.
Styling lives in presentational components — never add fetching or business logic here (see the `frontend-components` rule).

## Step 1 — Ensure Tailwind is set up

Check for an existing Tailwind setup before touching config: look for `@tailwindcss/vite` in `package.json`, `tailwindcss()` in `vite.config.*`, and `@import "tailwindcss"` in a CSS entry.
If any piece is missing, follow `references/styling-patterns.md` section "Tailwind v4 setup" (Vite plugin, CSS-first `@theme`, no `tailwind.config.js`).
Install Headless UI (`@headlessui/react`) only when the task needs an interactive primitive.

## Step 2 — Style with utilities

Read `references/styling-patterns.md` and apply it.
- Use utility classes directly on semantic markup; prefer design tokens over arbitrary values like `w-[317px]`.
- Compose conditional classes with the project's existing `clsx`/`cn` helper, not string concatenation.
- Keep responsive/state variants inline (`md:`, `hover:`, `dark:`); do not hand-write CSS the utilities already cover.

## Step 3 — Use Headless UI for interactive primitives

Consult the component inventory in `references/styling-patterns.md` before hand-rolling an interactive widget or form control.
When Headless UI provides the needed behavior, use it instead of rebuilding it.
It ships the keyboard, focus, and ARIA behavior; you supply the Tailwind classes.
Style element states with the data-attribute API (`data-[open]`, `data-[selected]`, `data-[focus]`) and animate with `<Transition>` / the `transition` prop.

## Step 4 — Keep it presentational and DRY-by-earn

- No `useQuery`/`fetch` in the component — data arrives via props or a hook.
- Extract a styled component or a shared class cluster only after a third real use; prefer duplication until then.

## Step 5 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_build
```

`run_build` confirms Tailwind compiles the classes you used.

## Checklist

- [ ] Tailwind v4 is wired via the Vite plugin and `@import "tailwindcss"` (no `tailwind.config.js` unless one already exists).
- [ ] Interactive widgets use Headless UI, not hand-rolled ARIA.
- [ ] Classes use design tokens; arbitrary values only when no token fits.
- [ ] Component stays presentational — no data fetching or business logic.
- [ ] No styled abstraction added before its third real use.
- [ ] `run_typecheck` and `run_build` pass.
