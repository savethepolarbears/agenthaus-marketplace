#!/usr/bin/env bash
# circuit-breaker loop guard — Stop hook that turns "keep going until done" into a
# deterministic, bounded loop.
#
# Contract (opt-in, per project):
#   1. Create .agenthaus/loop.json in the project:
#        { "completionCommand": "npm test", "maxIterations": 5,
#          "timeoutSec": 120, "chain": true }
#   2. Arm it once with `bash loop-arm.sh` (records this project's physical path
#      plus the file's sha256). An edited config, or an identical config in a
#      different checkout, is ignored until armed there, so a repo cannot make
#      the agent run arbitrary commands on Stop by itself.
#
# On every Stop event:
#   - no / disabled / un-armed config            -> allow stop (exit 0, no output)
#   - stop_hook_active=true and chain=false       -> allow stop
#   - completionCommand exits 0                   -> allow stop, clear state
#   - still failing and iterations < max          -> {"decision":"block", reason}
#   - still failing and iterations >= max         -> allow stop + systemMessage
# maxIterations is clamped to 1..8 so it always stays inside Claude Code's own
# consecutive-continuation cap. Any internal error allows the stop (fail-safe:
# the loop terminates rather than spins).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=loop-lib.sh
. "$SCRIPT_DIR/loop-lib.sh" || exit 0

STDIN_JSON="$(cat 2>/dev/null || true)"

BREAKER_CFG="$(loop_project_dir)/.circuit-breaker-config.json"
if [ -f "$BREAKER_CFG" ] && command -v jq >/dev/null 2>&1; then
    if [ "$(jq -r '.breakers?."loop-guard"?.enabled? == false' "$BREAKER_CFG" 2>/dev/null)" = "true" ]; then
        exit 0
    fi
fi

CONFIG="$(loop_config_path)"
[ -f "$CONFIG" ] && [ ! -L "$CONFIG" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

STATE_DIR="$(loop_state_root)" || exit 0
SESSION_KEY="$(loop_session_key "$(loop_json_field "$STDIN_JSON" session_id)")"
STATE_FILE="$STATE_DIR/$SESSION_KEY.json"
TRUST_FILE="$STATE_DIR/trusted"

# Armed for this exact project path and config content?
TRUST_KEY="$(loop_trust_key)" || exit 0
[ -f "$TRUST_FILE" ] && grep -Fqx -- "$TRUST_KEY" "$TRUST_FILE" 2>/dev/null || exit 0

ENABLED="$(jq -r '.enabled // true' "$CONFIG" 2>/dev/null || echo false)"
[ "$ENABLED" = "true" ] || exit 0
COMPLETION_CMD="$(jq -r '.completionCommand // empty' "$CONFIG" 2>/dev/null || true)"
[ -n "$COMPLETION_CMD" ] || exit 0
MAX="$(jq -r '.maxIterations // 5' "$CONFIG" 2>/dev/null || echo 5)"
[[ "$MAX" =~ ^[0-9]+$ ]] || MAX=5
[ "$MAX" -lt 1 ] && MAX=1
[ "$MAX" -gt 8 ] && MAX=8
TIMEOUT_SEC="$(jq -r '.timeoutSec // 120' "$CONFIG" 2>/dev/null || echo 120)"
[[ "$TIMEOUT_SEC" =~ ^[0-9]+$ ]] || TIMEOUT_SEC=120
[ "$TIMEOUT_SEC" -gt 540 ] && TIMEOUT_SEC=540
CHAIN="$(jq -r 'if .chain == false then "false" else "true" end' "$CONFIG" 2>/dev/null || echo true)"

STOP_ACTIVE="$(loop_json_field "$STDIN_JSON" stop_hook_active)"
if [ "$STOP_ACTIVE" = "true" ] && [ "$CHAIN" != "true" ]; then
    exit 0
fi

ITER=0
if [ -f "$STATE_FILE" ] && [ ! -L "$STATE_FILE" ]; then
    ITER="$(jq -r '.iterations // 0' "$STATE_FILE" 2>/dev/null || echo 0)"
    [[ "$ITER" =~ ^[0-9]+$ ]] || ITER=0
fi

# Run the completion check from the project root with a hard timeout. Without
# any way to bound it, do not run it (and do not continue the session).
if ! command -v timeout >/dev/null 2>&1 && ! command -v gtimeout >/dev/null 2>&1 \
    && ! command -v perl >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
    printf '{"systemMessage":%s}\n' "$(loop_json_escape "Loop guard: no timeout, gtimeout, perl or python3 available to bound the completion check; not looping.")"
    exit 0
fi
OUT_FILE="$STATE_DIR/$SESSION_KEY.out"
(
    cd "$(loop_project_dir)" 2>/dev/null || exit 97
    # GNU timeout where present (gtimeout on macOS with coreutils); otherwise
    # perl's alarm (stock on macOS), then python3. Exit 124 means timed out.
    if command -v timeout >/dev/null 2>&1; then
        timeout "$TIMEOUT_SEC" bash -c "$COMPLETION_CMD"
    elif command -v gtimeout >/dev/null 2>&1; then
        gtimeout "$TIMEOUT_SEC" bash -c "$COMPLETION_CMD"
    elif command -v perl >/dev/null 2>&1; then
        perl -e 'my $t = shift; my $pid = fork // exit 125;
                 if (!$pid) { setpgrp(0, 0); exec @ARGV or exit 127 }
                 local $SIG{ALRM} = sub { kill "TERM", -$pid; sleep 1; kill "KILL", -$pid; exit 124 };
                 alarm $t; waitpid($pid, 0); exit($? & 127 ? 128 + ($? & 127) : $? >> 8)' \
            "$TIMEOUT_SEC" bash -c "$COMPLETION_CMD"
    elif command -v python3 >/dev/null 2>&1; then
        python3 -I -c 'import os, signal, subprocess, sys
p = subprocess.Popen(sys.argv[2:], start_new_session=True)
try:
    sys.exit(p.wait(timeout=float(sys.argv[1])))
except subprocess.TimeoutExpired:
    os.killpg(p.pid, signal.SIGKILL); sys.exit(124)' "$TIMEOUT_SEC" bash -c "$COMPLETION_CMD"
    fi
) >"$OUT_FILE" 2>&1 </dev/null
RC=$?
TAIL="$(tail -c 1500 "$OUT_FILE" 2>/dev/null || true)"
rm -f "$OUT_FILE" 2>/dev/null || true

write_state() {
    local tmp="$STATE_FILE.tmp.$$"
    printf '{"iterations":%s,"lastExit":%s,"updatedAt":"%s"}\n' "$1" "$2" \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$tmp" 2>/dev/null && mv -f "$tmp" "$STATE_FILE" 2>/dev/null
}

if [ "$RC" -eq 0 ]; then
    rm -f "$STATE_FILE" 2>/dev/null || true
    printf '{"systemMessage":%s}\n' "$(loop_json_escape "Loop guard: completion check passed after $ITER continuation(s).")"
    exit 0
fi

if [ "$ITER" -ge "$MAX" ]; then
    rm -f "$STATE_FILE" 2>/dev/null || true
    printf '{"systemMessage":%s}\n' "$(loop_json_escape "Loop guard: stopping after $MAX continuation(s); completion check still failing (exit $RC). Human review needed.")"
    exit 0
fi

NEXT=$((ITER + 1))
write_state "$NEXT" "$RC" || exit 0
REASON="Loop guard iteration $NEXT/$MAX: the completion check \`$COMPLETION_CMD\` still fails (exit $RC). Fix the cause, do not weaken or skip the check, then finish. Last output:
$TAIL"
printf '{"decision":"block","reason":%s}\n' "$(loop_json_escape "$REASON")"
exit 0
