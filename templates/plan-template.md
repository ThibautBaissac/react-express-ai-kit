# Task {{ task title — replace with the real task title }}

## Overview

{{ Problem statement, scope, and any key architectural decisions you made.
   For non-technical users, surface the technical decisions you made silently here so
   future-you and reviewers can audit them. }}

## Implementation Plan

### Phase 1: {{ phase title }}

**Files to modify / create:**
- `path/to/file.ext` — {{ what changes }}

{{ Step-by-step changes, with code snippets, before/after, or rationale where useful. }}

### Phase 2: {{ phase title }}

{{ … repeat as needed. Order phases logically: infrastructure → models → controllers →
   views → helpers/utilities. Each phase should be a logical chunk a reviewer can verify
   in isolation. }}

## Testing Strategy

### Unit / component tests
- {{ Vitest spec/test files and what each one covers (colocated `*.test.ts` / `*.test.tsx`) }}

### Browser e2e (Playwright)
- {{ Asserted `e2e/*.spec.ts` flows for browser behavior — navigation, forms, auth,
     redirects, 404s — run via `pnpm e2e`. Playwright's webServer migrates + seeds an
     isolated `./e2e.db` and starts/stops the stack itself; no manual servers.
     Or an explicit "not needed because …" for backend/CLI-only tasks. }}

### Visual / responsive review (if the feature has UI impact)
- {{ Screenshots captured by `e2e/responsive.spec.ts` into `e2e/screenshots/` at 375px
     and 1440px, reviewed for a layout that breathes. Playwright captures; a human or
     vision-capable agent judges. Or "not needed because …". }}

## To-Do List

### Implementation
- [ ] {{ implementation step 1 }}
- [ ] {{ implementation step 2 }}

### Testing
- [ ] {{ unit / component tests }}
- [ ] {{ Playwright e2e specs + (if UI) responsive screenshot review }}

## Project Docs Update

{{ Note any updates required to project docs or instructions (for example
   CLAUDE.md, AGENTS.md, .claude/rules/*, or docs/*), or write
   "Not needed for this change." }}
