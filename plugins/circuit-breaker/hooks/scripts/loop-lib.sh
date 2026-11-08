#!/usr/bin/env bash
# Shared helpers for the circuit-breaker loop guard. Sourced, never executed.
# All state lives under a per-user, owner-only directory:
#   ${CLAUDE_PLUGIN_DATA}/loops  (Claude Code persistent plugin data), or
#   ${TMPDIR:-/tmp}/circuit-breaker-<uid>/loops as a portable fallback.

loop_state_root() {
    local base
    if [ -n "${CLAUDE_PLUGIN_DATA:-}" ]; then
        base="${CLAUDE_PLUGIN_DATA%/}"
    else
        local tmp="${TMPDIR:-/tmp}"
        tmp="${tmp%/}"
        base="${tmp:-/tmp}/circuit-breaker-${UID:-$(id -u 2>/dev/null || echo 0)}"
    fi
    local dir="$base/loops"
    [ -L "$base" ] && return 1
    [ -L "$dir" ] && return 1
    mkdir -p -m 700 "$dir" 2>/dev/null || return 1
    [ -d "$dir" ] && [ -O "$dir" ] && [ -w "$dir" ] || return 1
    printf '%s' "$dir"
}

# Sanitised session key (no path traversal, bounded length).
loop_session_key() {
    local raw="${1:-}"
    raw="$(printf '%s' "$raw" | tr -cd 'A-Za-z0-9_-' | cut -c1-128)"
    printf '%s' "${raw:-nosession}"
}

loop_project_dir() {
    local dir="${CLAUDE_PROJECT_DIR:-}"
    [ -n "$dir" ] || dir="$(pwd)"
    # CLAUDE_PROJECT_DIR stays on the main checkout when the session moves into
    # a git worktree; LOOP_ACTIVE_CWD (the hook payload's cwd, or the shell's
    # cwd for loop-arm) follows it. Map the project's path inside its own
    # worktree onto the active worktree, so loop.json, trust and the check all
    # refer to the checkout being worked on.
    if [ -n "${LOOP_ACTIVE_CWD:-}" ] && [ -d "$LOOP_ACTIVE_CWD" ] && command -v git >/dev/null 2>&1; then
        local proj_top active_top proj_common active_common rel
        proj_top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || proj_top=""
        active_top="$(git -C "$LOOP_ACTIVE_CWD" rev-parse --show-toplevel 2>/dev/null)" || active_top=""
        proj_common="$(git -C "$dir" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || proj_common=""
        active_common="$(git -C "$LOOP_ACTIVE_CWD" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || active_common=""
        # Only another worktree of the same repository, never an unrelated repo.
        if [ -n "$proj_top" ] && [ -n "$active_top" ] && [ "$proj_top" != "$active_top" ] \
            && [ -n "$proj_common" ] && [ "$proj_common" = "$active_common" ]; then
            rel="$(cd "$dir" && pwd -P)"
            rel="${rel#"$(cd "$proj_top" && pwd -P)"}"
            [ -d "$active_top$rel" ] && dir="$active_top$rel"
        fi
    fi
    printf '%s' "$dir"
}

# Trust key = "<physical project path> <config sha256>". Binding the path stops
# an identical loop.json in another checkout from inheriting an arm.
loop_trust_key() {
    local project sha
    project="$(cd "$(loop_project_dir)" 2>/dev/null && pwd -P)" || return 1
    sha="$(loop_sha256 "$(loop_config_path)" 2>/dev/null)" || return 1
    [ -n "$project" ] && [ -n "$sha" ] || return 1
    printf '%s %s' "$project" "$sha"
}

loop_config_path() {
    printf '%s/.agenthaus/loop.json' "$(loop_project_dir)"
}

loop_sha256() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    else
        return 1
    fi
}

# Print the field from stdin JSON using jq (preferred) or python3.
loop_json_field() {
    local json="$1" field="$2"
    if command -v jq >/dev/null 2>&1; then
        printf '%s' "$json" | jq -r --arg f "$field" '.[$f] // empty | tostring' 2>/dev/null || true
    elif command -v python3 >/dev/null 2>&1; then
        printf '%s' "$json" | python3 -c 'import json,sys
f=sys.argv[1]
try:
    v=json.load(sys.stdin).get(f)
    if v is None: pass
    elif isinstance(v,bool): print("true" if v else "false")
    else: print(v)
except Exception: pass' "$field" 2>/dev/null || true
    fi
}

# JSON-escape an arbitrary string (for reason/systemMessage fields).
loop_json_escape() {
    if command -v jq >/dev/null 2>&1; then
        printf '%s' "$1" | jq -Rs . 2>/dev/null
    elif command -v python3 >/dev/null 2>&1; then
        printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
    else
        printf '"%s"' "$(printf '%s' "$1" | tr -d '"\\\n\r' | cut -c1-500)"
    fi
}
