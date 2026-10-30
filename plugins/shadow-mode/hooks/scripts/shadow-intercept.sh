#!/usr/bin/env bash
# Claude Code PreToolUse: exit 0 allows; exit 2 blocks. Hooks are guidance,
# not a universal execution boundary or protection against same-user bypass.
set -euo pipefail
[ -f .shadow-mode-enabled ] || exit 0

# Keep raw input exclusively in memory; never persist commands, paths, content,
# arbitrary tool names, or alleged redacted versions. Missing dependencies and
# storage failures must still return the blocking exit code.
if ! command -v python3 >/dev/null 2>&1; then
    echo 'SHADOW MODE: Python 3 unavailable; action blocked without a queue record.' >&2
    exit 2
fi
if ! python3 - 3<&0 <<'PY'
import datetime
import hashlib
import json
import os
import stat
import tempfile
import uuid

try:
    # Read only a bounded prefix; oversized requests are never parsed or queued.
    input_limit = 4 * 1024 * 1024
    raw = os.fdopen(3, 'rb').read(input_limit + 1)
    if len(raw) > input_limit:
        print('SHADOW MODE: 4 MiB input limit exceeded; action blocked without a queue record.', file=__import__('sys').stderr)
        raise SystemExit(0)
    try:
        requested_tool = json.loads(raw).get('tool_name')
    except (ValueError, AttributeError):
        requested_tool = None
    tool = requested_tool if requested_tool in ('Write', 'Edit', 'Bash') else 'unknown'
    queue = 'review_queue'
    os.makedirs(queue, mode=0o700, exist_ok=True)
    if not stat.S_ISDIR(os.lstat(queue).st_mode):
        raise ValueError('queue must be a directory, not a symlink')
    entry = {
        'schema_version': 2,
        'id': uuid.uuid4().hex,
        'tool': tool,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'status': 'pending',
        'request_sha256': hashlib.sha256(raw).hexdigest(),
        'requires_fresh_review': True,
    }
    fd, temporary = tempfile.mkstemp(prefix='.pending-', dir=queue)
    try:
        with os.fdopen(fd, 'w') as output:
            json.dump(entry, output)
            output.write('\n')
            output.flush()
            os.fsync(output.fileno())
        # Hard link publishes a complete record atomically and refuses overwrite.
        destination = os.path.join(queue, entry['id'] + '.json')
        os.link(temporary, destination)
    finally:
        os.unlink(temporary)
    print('SHADOW MODE: Digest-only proposal queued. Fresh review of the original request is required.', file=__import__('sys').stderr)
except Exception:
    # Never echo exception text: OS errors can contain sensitive paths.
    raise SystemExit(1)
PY
then
    echo 'SHADOW MODE: Queue unavailable; action blocked without a queue record.' >&2
fi
exit 2
