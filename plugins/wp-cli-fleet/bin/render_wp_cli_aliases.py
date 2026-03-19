#!/usr/bin/env python3
"""Generate a wp-cli.yml aliases file from a fleet manifest.

Usage:
    python3 render_wp_cli_aliases.py <manifest.json> --output <wp-cli.yml>

Examples:
    python3 render_wp_cli_aliases.py fleet.json --output wp-cli.fleet.yml
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path


def load_manifest(path: str) -> dict:
    """Load and validate a fleet manifest JSON file."""
    manifest_path = Path(path)
    if not manifest_path.exists():
        print(f"Error: Manifest file not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(manifest_path) as f:
        return json.load(f)


def render_aliases(manifest: dict) -> str:
    """Render a wp-cli.yml aliases section from the manifest."""
    sites = manifest.get("sites", [])
    groups = defaultdict(list)
    lines = ["# Auto-generated from fleet manifest", "# Do not edit manually", ""]

    for site in sites:
        alias = site.get("alias", "")
        if not alias:
            continue

        # Strip the leading @ for YAML key
        key = alias.lstrip("@")
        ssh_target = site.get("ssh")
        path = site.get("path")
        url = site.get("url", "")

        lines.append(f"@{key}:")
        if ssh_target:
            ssh_value = ssh_target
            if path:
                ssh_value = f"{ssh_target}{path}"
            lines.append(f"  ssh: {ssh_value}")
        if url:
            lines.append(f"  url: {url}")
        lines.append("")

        # Collect group memberships
        for group in site.get("groups", []):
            groups[group].append(f"@{key}")

    # Render alias groups
    if groups:
        lines.append("# Alias groups")
        for group_alias, members in sorted(groups.items()):
            key = group_alias.lstrip("@")
            member_list = ", ".join(members)
            lines.append(f"@{key}:")
            for member in members:
                lines.append(f"  - {member}")
            lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Generate wp-cli.yml aliases from a fleet manifest."
    )
    parser.add_argument("manifest", help="Path to fleet manifest JSON file")
    parser.add_argument(
        "--output", "-o", default="-",
        help="Output file path (default: stdout)"
    )

    args = parser.parse_args()
    manifest = load_manifest(args.manifest)
    content = render_aliases(manifest)

    if args.output == "-":
        print(content)
    else:
        Path(args.output).write_text(content)
        print(f"Aliases written to: {args.output}")


if __name__ == "__main__":
    main()
