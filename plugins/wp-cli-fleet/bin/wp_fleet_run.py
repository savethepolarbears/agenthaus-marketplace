#!/usr/bin/env python3
"""Run a WP-CLI command across a fleet of WordPress sites.

Usage:
    python3 wp_fleet_run.py <manifest.json> [options] -- <wp-cli-command>

Options:
    --group <alias-group>   Filter sites by group (e.g., @prod)
    --alias <site-alias>    Target a single site by alias (e.g., @brand-prod)
    --fail-fast             Stop on the first site that fails
    --list                  List sites and groups without running a command
    --json                  Output results as JSON

Examples:
    python3 wp_fleet_run.py fleet.json --list
    python3 wp_fleet_run.py fleet.json --group @prod -- plugin list --format=json
    python3 wp_fleet_run.py fleet.json --alias @brand-prod -- core version
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def load_manifest(path: str) -> dict:
    """Load and validate a fleet manifest JSON file."""
    manifest_path = Path(path)
    if not manifest_path.exists():
        print(f"Error: Manifest file not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(manifest_path) as f:
        data = json.load(f)
    if "sites" not in data:
        print("Error: Manifest must contain a 'sites' array.", file=sys.stderr)
        sys.exit(1)
    return data


def filter_sites(sites: list, group: str = None, alias: str = None) -> list:
    """Filter sites by group or alias."""
    if alias:
        return [s for s in sites if s.get("alias") == alias]
    if group:
        return [s for s in sites if group in s.get("groups", [])]
    return sites


def list_fleet(manifest: dict) -> None:
    """Print sites and groups from the manifest."""
    sites = manifest.get("sites", [])
    groups = set()
    for site in sites:
        for g in site.get("groups", []):
            groups.add(g)

    print(f"Fleet: {manifest.get('name', 'unnamed')}")
    print(f"Sites: {len(sites)}")
    print(f"Groups: {', '.join(sorted(groups))}")
    print()
    print(f"{'Alias':<20} {'Label':<30} {'Environment':<15} {'Groups'}")
    print("-" * 90)
    for site in sites:
        alias = site.get("alias", "")
        label = site.get("label", "")
        env = site.get("environment", "")
        site_groups = ", ".join(site.get("groups", []))
        print(f"{alias:<20} {label:<30} {env:<15} {site_groups}")


def build_wp_command(site: dict, wp_args: list) -> list:
    """Build the full WP-CLI command for a site."""
    ssh_target = site.get("ssh")
    path = site.get("path")
    alias = site.get("alias")

    if ssh_target and path:
        return ["wp", f"--ssh={ssh_target}/{path}"] + wp_args
    elif alias:
        return ["wp", alias] + wp_args
    else:
        return ["wp"] + wp_args


def run_on_site(site: dict, wp_args: list) -> dict:
    """Run a WP-CLI command on a single site and return the result."""
    cmd = build_wp_command(site, wp_args)
    result = {
        "alias": site.get("alias", "unknown"),
        "label": site.get("label", ""),
        "url": site.get("url", ""),
        "command": " ".join(cmd),
        "success": False,
        "stdout": "",
        "stderr": "",
        "exit_code": -1,
    }

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        result["stdout"] = proc.stdout
        result["stderr"] = proc.stderr
        result["exit_code"] = proc.returncode
        result["success"] = proc.returncode == 0
    except subprocess.TimeoutExpired:
        result["stderr"] = "Command timed out after 120 seconds"
        result["exit_code"] = 124
    except FileNotFoundError:
        result["stderr"] = "wp command not found. Is WP-CLI installed?"
        result["exit_code"] = 127

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Run WP-CLI commands across a WordPress fleet."
    )
    parser.add_argument("manifest", help="Path to fleet manifest JSON file")
    parser.add_argument("--group", help="Filter sites by group alias")
    parser.add_argument("--alias", help="Target a single site by alias")
    parser.add_argument(
        "--fail-fast", action="store_true", help="Stop on first failure"
    )
    parser.add_argument(
        "--list", action="store_true", help="List sites and groups"
    )
    parser.add_argument(
        "--json", action="store_true", help="Output results as JSON"
    )

    args, remaining = parser.parse_known_args()

    # Strip the -- separator if present
    wp_args = remaining
    if wp_args and wp_args[0] == "--":
        wp_args = wp_args[1:]

    manifest = load_manifest(args.manifest)

    if args.list:
        list_fleet(manifest)
        return

    if not wp_args:
        print("Error: No WP-CLI command specified.", file=sys.stderr)
        print("Usage: wp_fleet_run.py <manifest> [options] -- <wp-cli-command>", file=sys.stderr)
        sys.exit(1)

    sites = filter_sites(manifest.get("sites", []), args.group, args.alias)
    if not sites:
        print("No sites matched the specified filter.", file=sys.stderr)
        sys.exit(1)

    results = []
    failed = 0

    for site in sites:
        label = site.get("label", site.get("alias", "unknown"))
        if not args.json:
            print(f"\n--- {label} ({site.get('alias', '')}) ---")

        result = run_on_site(site, wp_args)
        results.append(result)

        if not args.json:
            if result["success"]:
                print(result["stdout"].rstrip())
            else:
                print(f"FAILED (exit {result['exit_code']})", file=sys.stderr)
                if result["stderr"]:
                    print(result["stderr"].rstrip(), file=sys.stderr)

        if not result["success"]:
            failed += 1
            if args.fail_fast:
                print(f"\nStopping: --fail-fast and {label} failed.", file=sys.stderr)
                break

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        total = len(results)
        succeeded = total - failed
        print(f"\n{'='*60}")
        print(f"Fleet run complete: {succeeded}/{total} succeeded, {failed} failed")


if __name__ == "__main__":
    main()
