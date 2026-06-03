#!/usr/bin/env bash
# detect-toolchain.sh — single source of truth for package manager + test runner.
#
# NEVER hardcode pnpm/npm/yarn or vitest/jest anywhere else. Source this file
# and use PM / PM_RUN / PM_EXEC / TEST_RUNNER and the run_* helpers instead.
#
# Usage:
#   source "<path>/detect-toolchain.sh"      # then call pm_run / run_tests / ...
#   bash   "<path>/detect-toolchain.sh"      # prints a one-line summary
#   bash   "<path>/detect-toolchain.sh" json # prints machine-readable summary
#
# Detection starts at $TOOLCHAIN_ROOT (or $CLAUDE_PROJECT_DIR, or $PWD) and walks
# up to the nearest directory containing package.json — so it works from a
# subdirectory and in monorepos.

# --- locate the project root (nearest ancestor with package.json) -------------
detect_project_root() {
  local dir="${1:-${TOOLCHAIN_ROOT:-${CLAUDE_PROJECT_DIR:-$PWD}}}"
  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    if [ -f "$dir/package.json" ]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  # No package.json found: fall back to the starting directory.
  printf '%s\n' "${1:-${TOOLCHAIN_ROOT:-${CLAUDE_PROJECT_DIR:-$PWD}}}"
  return 1
}

# --- read a value from package.json (node if present, grep fallback) ----------
_pkg_field() {
  # $1 = project root, $2 = top-level key (e.g. "packageManager")
  local root="$1" key="$2"
  [ -f "$root/package.json" ] || return 1
  if command -v node >/dev/null 2>&1; then
    node -e '
      try {
        const p = require(process.argv[1] + "/package.json");
        const v = p[process.argv[2]];
        if (v != null) process.stdout.write(String(v));
      } catch (e) { process.exit(1); }
    ' "$root" "$key" 2>/dev/null
  else
    # crude fallback: first "key": "value" match
    grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$root/package.json" 2>/dev/null \
      | head -1 | sed 's/.*:[[:space:]]*"\(.*\)"/\1/'
  fi
}

# --- detect package manager by lockfile, then packageManager field ------------
detect_pm() {
  local root="${1:-$(detect_project_root)}"
  if   [ -f "$root/pnpm-lock.yaml" ];      then echo "pnpm"
  elif [ -f "$root/yarn.lock" ];           then echo "yarn"
  elif [ -f "$root/package-lock.json" ] || [ -f "$root/npm-shrinkwrap.json" ]; then echo "npm"
  else
    local field; field="$(_pkg_field "$root" packageManager)"
    case "$field" in
      pnpm@*) echo "pnpm" ;;
      yarn@*) echo "yarn" ;;
      npm@*)  echo "npm" ;;
      *)      echo "npm" ;;  # safe default
    esac
  fi
}

# --- detect test runner from deps + the "test" script -------------------------
detect_test_runner() {
  local root="${1:-$(detect_project_root)}"
  [ -f "$root/package.json" ] || { echo "unknown"; return 1; }
  local pkg; pkg="$(cat "$root/package.json" 2>/dev/null)"
  case "$pkg" in
    *'"vitest"'*) echo "vitest"; return 0 ;;
  esac
  case "$pkg" in
    *'"jest"'*|*'ts-jest'*) echo "jest"; return 0 ;;
  esac
  # Fall back to inspecting the test script text.
  local script; script="$(_pkg_field "$root" scripts 2>/dev/null)"
  case "$pkg" in
    *vitest*) echo "vitest" ;;
    *jest*)   echo "jest" ;;
    *)        echo "unknown" ;;
  esac
}

# --- resolve and export everything -------------------------------------------
PROJECT_ROOT="$(detect_project_root)"
PM="$(detect_pm "$PROJECT_ROOT")"
TEST_RUNNER="$(detect_test_runner "$PROJECT_ROOT")"

case "$PM" in
  pnpm) PM_RUN="pnpm run"; PM_EXEC="pnpm exec";   PM_DLX="pnpm dlx" ;;
  yarn) PM_RUN="yarn";     PM_EXEC="yarn exec";   PM_DLX="yarn dlx" ;;
  *)    PM_RUN="npm run";  PM_EXEC="npx";         PM_DLX="npx" ;;
esac

export PROJECT_ROOT PM PM_RUN PM_EXEC PM_DLX TEST_RUNNER

# --- helper functions (use these instead of raw runner names) -----------------

# pm_run <script> [args...] — run a package.json script with the detected PM.
pm_run() {
  local script="$1"; shift || true
  ( cd "$PROJECT_ROOT" && $PM_RUN "$script" "$@" )
}

# has_script <name> — 0 if package.json defines that script.
has_script() {
  case "$(cat "$PROJECT_ROOT/package.json" 2>/dev/null)" in
    *"\"$1\""*) return 0 ;;
    *) return 1 ;;
  esac
}

# run_tests [path...] — run the test runner, preferring a "test" script.
run_tests() {
  if has_script test; then
    pm_run test "$@"
  elif [ "$TEST_RUNNER" = "vitest" ]; then
    ( cd "$PROJECT_ROOT" && $PM_EXEC vitest run "$@" )
  elif [ "$TEST_RUNNER" = "jest" ]; then
    ( cd "$PROJECT_ROOT" && $PM_EXEC jest "$@" )
  else
    echo "detect-toolchain: no test script or known runner found" >&2
    return 1
  fi
}

# run_typecheck — prefer a "typecheck" script, else tsc --noEmit.
run_typecheck() {
  if has_script typecheck; then
    pm_run typecheck "$@"
  elif has_script type-check; then
    pm_run type-check "$@"
  else
    ( cd "$PROJECT_ROOT" && $PM_EXEC tsc --noEmit "$@" )
  fi
}

# run_lint [args...] — prefer a "lint" script, else eslint over the project.
run_lint() {
  if has_script lint; then
    pm_run lint "$@"
  else
    ( cd "$PROJECT_ROOT" && $PM_EXEC eslint "$@" )
  fi
}

# run_format [args...] — prefer a "format" script, else prettier --write.
run_format() {
  if has_script format; then
    pm_run format "$@"
  else
    ( cd "$PROJECT_ROOT" && $PM_EXEC prettier --write "$@" )
  fi
}

# run_build — prefer a "build" script.
run_build() {
  if has_script build; then
    pm_run build "$@"
  else
    echo "detect-toolchain: no build script found" >&2
    return 1
  fi
}

# --- direct invocation: print a summary --------------------------------------
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  case "${1:-text}" in
    json)
      printf '{"projectRoot":"%s","packageManager":"%s","testRunner":"%s"}\n' \
        "$PROJECT_ROOT" "$PM" "$TEST_RUNNER" ;;
    *)
      printf 'Toolchain: package manager=%s, test runner=%s (root: %s)\n' \
        "$PM" "$TEST_RUNNER" "$PROJECT_ROOT" ;;
  esac
fi
