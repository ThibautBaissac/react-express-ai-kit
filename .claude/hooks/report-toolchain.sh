#!/usr/bin/env bash
# SessionStart hook: report the detected toolchain + an architecture reminder to Claude.
# Emits hookSpecificOutput.additionalContext. Cheap, runs once per session.
set -uo pipefail   # not -e: detect-toolchain returns 1 when no package.json is found

# Resolve a node that actually runs (guards against lazy nvm shims that exist on PATH
# but fail in a non-interactive shell). Empty => use the printf fallback.
NODE=""
if command -v node >/dev/null 2>&1 && node -e '' >/dev/null 2>&1; then NODE="node"; fi

LIB="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/lib/detect-toolchain.sh"
[ -f "$LIB" ] || exit 0   # pack not installed here; do nothing

# shellcheck source=/dev/null
. "$LIB"

CONTEXT="Toolchain (auto-detected): package manager=${PM}, test runner=${TEST_RUNNER}. \
Use the package manager and test runner above (do not hardcode npm/vitest); the \
.claude/lib/detect-toolchain.sh helpers (pm_run, run_tests, run_typecheck, run_lint, \
run_build) route commands correctly. Architecture: hybrid layout — feature slices for domain \
code over a shared/ layer for cross-cutting infra (features depend on shared, never the \
reverse; no feature-to-feature imports) — with one-way layering (route → service → repository \
on the backend; component → hook → store on the frontend), shared zod contracts across FE/BE, \
parse-don't-validate at boundaries."

# Emit JSON via node when available (robust escaping); fall back to printf.
# CONTEXT contains no double quotes/newlines, so the printf fallback is also valid JSON.
if [ -n "$NODE" ]; then
  CONTEXT="$CONTEXT" "$NODE" -e '
    const ctx = process.env.CONTEXT;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx }
    }));
  '
else
  # Minimal fallback (context has no embedded quotes/newlines to escape).
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}' "$CONTEXT"
fi
