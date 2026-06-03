#!/usr/bin/env bash
# PostToolUse hook (Edit|Write|MultiEdit): format the edited TS/TSX file and lint it.
# - Formats best-effort (never blocks on formatting).
# - On lint errors, exits 2 so the message is fed back to Claude to self-correct.
# - No-ops quickly for non-TS files or when the tools aren't installed (no npx auto-install).
set -uo pipefail

# Resolve a node that actually runs (guards against lazy nvm shims). Empty => fallback.
NODE=""
if command -v node >/dev/null 2>&1 && node -e '' >/dev/null 2>&1; then NODE="node"; fi

# --- read the hook payload from stdin and extract the edited file path --------
PAYLOAD="$(cat)"
extract_path() {
  if [ -n "$NODE" ]; then
    printf '%s' "$PAYLOAD" | "$NODE" -e '
      let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
        try { const j=JSON.parse(s); const t=j.tool_input||{};
          process.stdout.write(t.file_path || t.path || ""); } catch { process.stdout.write(""); }
      });'
  else
    printf '%s' "$PAYLOAD" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
      | head -1 | sed 's/.*:[[:space:]]*"\(.*\)"/\1/'
  fi
}
FILE="$(extract_path)"

# Only act on TypeScript/TSX files.
case "$FILE" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

LIB="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/lib/detect-toolchain.sh"
[ -f "$LIB" ] || exit 0
# shellcheck source=/dev/null
. "$LIB"

BIN="$PROJECT_ROOT/node_modules/.bin"

# Format (best-effort, non-blocking) — only if prettier is installed locally.
if [ -x "$BIN/prettier" ]; then
  "$BIN/prettier" --write "$FILE" >/dev/null 2>&1 || true
fi

# Lint the single file — only if eslint is installed locally. Block on errors.
if [ -x "$BIN/eslint" ]; then
  if ! OUT="$("$BIN/eslint" "$FILE" 2>&1)"; then
    {
      echo "ESLint reported problems in $FILE:"
      echo "$OUT"
      echo "Fix these lint errors before continuing."
    } >&2
    exit 2
  fi
fi

exit 0
