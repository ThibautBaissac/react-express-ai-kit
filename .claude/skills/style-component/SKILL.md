---
name: style-component
description: "Style React UI with Tailwind CSS v4 utilities and Headless UI accessible primitives, wired into presentational components without breaking one-way layering."
when_to_use: "Use WHEN styling or restyling a component, building a dialog/menu/combobox/listbox/popover/tabs/switch/disclosure, adding transitions, or setting up Tailwind — whether the user asks directly or an implementation agent is realizing a matching To-Do item from a `tasks/task-N.md` plan. Do NOT use to fetch data or add business logic (that lives in hooks/services), and do NOT use for backend work."
argument-hint: "[component-or-feature]"
arguments: [target]
model: sonnet
---

# Style a component with Tailwind + Headless UI

Style `$target` with utilities. Use Headless UI for accessible interactive
elements. Keep fetching and business logic out of presentational components.

## Step 1 — Ensure Tailwind is set up

Check for `@tailwindcss/vite`, `tailwindcss()` in `vite.config.*`, and
`@import "tailwindcss"` in a CSS entry. If incomplete, apply the reference
section "Tailwind v4 setup". Install `@headlessui/react` only when needed.

## Step 2 — Style with utilities

Apply `references/styling-patterns.md`.
- Use utility classes directly on semantic markup; prefer design tokens over arbitrary values like `w-[317px]`.
- Compose conditional classes with the project's existing `clsx`/`cn` helper, not string concatenation.
- Keep responsive/state variants inline (`md:`, `hover:`, `dark:`); do not hand-write CSS the utilities already cover.

## Step 3 — Use Headless UI for interactive primitives

Check the reference inventory before building an interactive widget. Use
Headless UI when it provides the behavior; it owns keyboard, focus, and ARIA.
Style with data attributes and `<Transition>` or `transition`.

## Step 4 — Keep it presentational and DRY-by-earn

- No `useQuery`/`fetch` in the component — data arrives via props or a hook.
- Generic, domain-free primitives (`Button`, `Card`, `Dialog`) belong in `shared/ui` from the start.
- For *domain* styled components, extract a shared cluster only after a third real use; prefer duplication until then.

## Step 5 — Verify

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
run_typecheck
run_build
```

`run_build` confirms Tailwind compiles the used classes.

## Checklist

- [ ] Tailwind v4 is wired via the Vite plugin and `@import "tailwindcss"` (no `tailwind.config.js` unless one already exists).
- [ ] Interactive widgets use Headless UI, not hand-rolled ARIA.
- [ ] Classes use design tokens; arbitrary values only when no token fits.
- [ ] Component stays presentational — no data fetching or business logic.
- [ ] Domain-free primitives live in `shared/ui`; no domain styled abstraction added before its third real use.
- [ ] `run_typecheck` and `run_build` pass.
