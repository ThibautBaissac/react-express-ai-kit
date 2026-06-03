#!/usr/bin/env bash
# PreToolUse hook (Bash): if a command installs deps with a package manager that
# contradicts the repo's lockfile, ask the user to confirm (warn, don't hard-block).
# Enforces the "auto-detect the toolchain" rule at runtime.
set -uo pipefail

# Resolve a node that actually runs (guards against lazy nvm shims). Empty => fallback.
NODE=""
if command -v node >/dev/null 2>&1 && node -e '' >/dev/null 2>&1; then NODE="node"; fi

PAYLOAD="$(cat)"
extract_cmd() {
  if [ -n "$NODE" ]; then
    printf '%s' "$PAYLOAD" | "$NODE" -e '
      let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
        try { const j=JSON.parse(s); process.stdout.write((j.tool_input&&j.tool_input.command)||""); }
        catch { process.stdout.write(""); }
      });'
  else
    printf '%s' "$PAYLOAD" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' \
      | head -1 | sed 's/.*:[[:space:]]*"\(.*\)"/\1/'
  fi
}
CMD="$(extract_cmd)"
[ -n "$CMD" ] || exit 0

LIB="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/lib/detect-toolchain.sh"
[ -f "$LIB" ] || exit 0
# shellcheck source=/dev/null
. "$LIB"

# Which package manager does this command use for an install/add operation?
used=""
case "$CMD" in
  *"pnpm add"*|*"pnpm install"*|*"pnpm i "*|*"pnpm ci"*) used="pnpm" ;;
  *"yarn add"*|*"yarn install"*|*"yarn ci"*)             used="yarn" ;;
  *"npm install"*|*"npm i "*|*"npm ci"*|*"npm add"*)      used="npm" ;;
esac

# Only act on a genuine mismatch with the detected PM.
if [ -n "$used" ] && [ "$used" != "$PM" ]; then
  REASON="This repo's lockfile indicates '$PM', but the command uses '$used'. Mixing \
package managers corrupts the lockfile/node_modules. Prefer '$PM' (e.g. via the \
detect-toolchain.sh helpers). Confirm if you really intend to use '$used'."
  if [ -n "$NODE" ]; then
    REASON="$REASON" "$NODE" -e '
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: process.env.REASON
        }
      }));'
  else
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}' "$REASON"
  fi
fi

exit 0
