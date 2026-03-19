#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
PLUGINS_DIR="$ROOT_DIR/plugins"
OUTPUT="$ROOT_DIR/skills_index.json"

echo "Generating skills_index.json..."

python3 << 'PYEOF'
import os, re, json, sys
from datetime import date

plugins_dir = sys.argv[1] if len(sys.argv) > 1 else "plugins"
output_file = sys.argv[2] if len(sys.argv) > 2 else "skills_index.json"

files = []
for root, dirs, fnames in sorted(os.walk(plugins_dir)):
    for f in sorted(fnames):
        path = os.path.join(root, f)
        rel = path
        if re.match(r'plugins/[^/]+/agents/[^/]+\.md$', rel):
            files.append((rel, "agent"))
        elif re.match(r'plugins/[^/]+/skills/[^/]+/SKILL\.md$', rel):
            files.append((rel, "skill"))
        elif re.match(r'plugins/[^/]+/commands/[^/]+\.md$', rel):
            files.append((rel, "command"))

files.sort()

entries = []
for filepath, ftype in files:
    parts = filepath.split("/")
    plugin_name = parts[1]

    name = None
    description = None
    try:
        with open(filepath) as fh:
            content = fh.read()
        fm_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if fm_match:
            fm = fm_match.group(1)
            nm = re.search(r'^name:\s*["\']?(.+?)["\']?\s*$', fm, re.MULTILINE)
            if nm:
                name = nm.group(1).strip()
            dm = re.search(r'^description:\s*["\']?(.+?)["\']?\s*$', fm, re.MULTILINE)
            if dm:
                description = dm.group(1).strip()
    except Exception:
        pass

    if not name:
        if ftype == "skill":
            name = parts[3].replace("-", " ").title()
        else:
            fname = os.path.splitext(parts[-1])[0]
            name = fname.replace("-", " ").title()

    if ftype == "skill":
        file_id = parts[3]
    else:
        file_id = os.path.splitext(parts[-1])[0]

    entry = {
        "id": f"{plugin_name}:{file_id}",
        "plugin": plugin_name,
        "type": ftype,
        "name": name,
        "path": filepath
    }
    if description:
        entry["description"] = description

    entries.append(entry)

index = {
    "$schema": "https://github.com/savethepolarbears/agenthaus-marketplace/schemas/skills-index.schema.json",
    "version": "1.0.0",
    "generated": str(date.today()),
    "description": "Lightweight skill index for progressive disclosure. Agents load this at startup; full SKILL.md content is loaded on demand.",
    "entries": entries
}

with open(output_file, "w") as f:
    json.dump(index, f, indent=2)
    f.write("\n")

print(f"Generated {output_file} with {len(entries)} entries ({sum(1 for e in entries if e['type']=='agent')} agents, {sum(1 for e in entries if e['type']=='skill')} skills, {sum(1 for e in entries if e['type']=='command')} commands)")
PYEOF

echo "Done."
