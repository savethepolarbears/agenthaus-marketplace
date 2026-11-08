#!/usr/bin/env python3
"""Work out what a shell command will actually do to git, without running it.

Used by circuit-breaker hooks so their decisions follow git's semantics rather
than regex guesses. The command string is split with shlex and never evaluated
by a shell; git is only invoked read-only (diff, ls-files, rev-parse,
add --dry-run) with argv lists.

Usage:
  git_intent.py commit-set "<command>"      prints the paths the first
                                            `git commit` would record, one per
                                            line, or the single line UNKNOWN
  git_intent.py push-protected "<command>"  prints "yes" if any `git push`
                                            would update a protected branch
                                            (or tags/all/mirror), else "no";
                                            UNKNOWN if it cannot tell
"""
import re
import shlex
import subprocess
import sys

PROTECTED = re.compile(r"^(main|master|prod|production)$")
UNKNOWN = "UNKNOWN"


class Unknown(Exception):
    pass


def git(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True, timeout=15)
    if r.returncode != 0:
        raise Unknown(r.stderr.strip())
    return r.stdout


def lines(text):
    return [l for l in text.splitlines() if l]


def segments(cmd):
    try:
        lexer = shlex.shlex(cmd, posix=True, punctuation_chars=";&|()")
        lexer.whitespace_split = True
        tokens = list(lexer)
    except ValueError as exc:
        raise Unknown(str(exc))
    segs, cur = [], []
    for tok in tokens:
        if tok and set(tok) <= set(";&|()"):
            if cur:
                segs.append(cur)
            cur = []
        else:
            cur.append(tok)
    if cur:
        segs.append(cur)
    return segs


def git_sub(seg):
    """Return (subcommand, args) for a `git ...` segment, else (None, [])."""
    # Skip leading env assignments (FOO=bar git commit ...).
    i = 0
    while i < len(seg) and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", seg[i]):
        i += 1
    if i >= len(seg) or seg[i] != "git":
        return None, []
    i += 1
    while i < len(seg) and seg[i].startswith("-"):
        if seg[i] in ("-C", "--git-dir", "--work-tree"):
            raise Unknown("git invoked against another repository")
        i += 2 if seg[i] == "-c" else 1
    if i >= len(seg):
        return None, []
    return seg[i], seg[i + 1:]


# git commit options that consume the next argument (long forms may also use =).
COMMIT_VALUE_LONG = {"--message", "--file", "--reuse-message", "--reedit-message",
                     "--template", "--author", "--date", "--cleanup", "--fixup",
                     "--squash", "--trailer", "--pathspec-from-file"}
COMMIT_VALUE_SHORT = set("mFCct")


def parse_commit(args):
    opts, paths, pathspec_file, nul = set(), [], None, False
    i, only_paths = 0, False
    while i < len(args):
        a = args[i]
        if only_paths:
            paths.append(a)
        elif a == "--":
            only_paths = True
        elif a.startswith("--"):
            name, eq, val = a.partition("=")
            if name == "--pathspec-from-file":
                if not eq:
                    i += 1
                    val = args[i] if i < len(args) else ""
                pathspec_file = val
            elif name == "--pathspec-file-nul":
                nul = True
            elif name in COMMIT_VALUE_LONG and not eq:
                i += 1
            opts.add(name)
        elif a.startswith("-") and len(a) > 1:
            cluster = a[1:]
            for j, ch in enumerate(cluster):
                opts.add("-" + ch)
                if ch in COMMIT_VALUE_SHORT:
                    if j == len(cluster) - 1:
                        i += 1  # value is the next argument
                    break  # otherwise the rest of the cluster is the value
        else:
            paths.append(a)
        i += 1
    if pathspec_file is not None:
        if pathspec_file in ("", "-"):
            raise Unknown("pathspec read from stdin")
        try:
            data = open(pathspec_file, encoding="utf-8").read()
        except OSError as exc:
            raise Unknown(str(exc))
        paths += [p for p in (data.split("\0") if nul else data.splitlines()) if p]
    return opts, paths


def simulate_add(args, staged):
    flags = [a for a in args if a.startswith("-") and a != "--"]
    if any(f in ("-p", "--patch", "-i", "--interactive", "-e", "--edit") for f in flags):
        raise Unknown("interactive git add")
    paths = [a for a in args if not a.startswith("-")]
    cmd = ["add", "--dry-run", *flags] + (["--", *paths] if paths else [])
    for line in lines(git(*cmd)):
        if line.startswith("add '") and line.endswith("'"):
            staged.add(line[5:-1])


def commit_set(cmd):
    staged = set(lines(git("diff", "--cached", "--name-only")))
    for seg in segments(cmd):
        sub, args = git_sub(seg)
        if sub == "add":
            simulate_add(args, staged)
        elif sub == "commit":
            opts, paths = parse_commit(args)
            if "--amend" in opts:
                # The amended commit keeps HEAD's changes plus the new ones.
                staged |= set(lines(git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD")))
            all_tracked = "-a" in opts or "--all" in opts
            if paths:
                # `git commit <paths>` (default --only) records exactly the
                # changes under those paths, ignoring other staged files;
                # --include adds them to the staged set.
                matched = set(lines(git("ls-files", "--cached", "--others",
                                        "--exclude-standard", "--", *paths)))
                try:
                    changed = set(lines(git("diff", "--name-only", "HEAD", "--", *paths)))
                except Unknown:  # no HEAD yet
                    changed = set()
                result = changed | (staged & matched)
                if "-i" in opts or "--include" in opts:
                    result |= staged
                return result
            if all_tracked:
                staged |= set(lines(git("diff", "--name-only")))
            return staged
    return staged


def current_branch():
    return git("rev-parse", "--abbrev-ref", "HEAD").strip()


def push_targets(args):
    """Return the destination branch names a `git push` would update."""
    value_opts = {"--repo", "--receive-pack", "--exec", "-o", "--push-option"}
    positional, i = [], 0
    while i < len(args):
        a = args[i]
        if a in ("--all", "--mirror", "--tags", "--branches"):
            return ["<all>"]
        if a in value_opts:
            i += 2
            continue
        if a == "--":
            positional += args[i + 1:]
            break
        if not a.startswith("-"):
            positional.append(a)
        i += 1
    refspecs = positional[1:]
    if not refspecs:
        # No refspec: push.default (simple/upstream/current) pushes the current
        # branch to its upstream, so resolve the effective destination.
        try:
            upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}").strip()
            return [upstream.split("/", 1)[1] if "/" in upstream else upstream, current_branch()]
        except Unknown:
            return [current_branch()]
    out = []
    for spec in refspecs:
        spec = spec.lstrip("+")
        src, colon, dst = spec.partition(":")
        target = dst if colon else src
        if target in ("HEAD", "@", ""):
            target = current_branch()
        target = re.sub(r"^refs/heads/", "", target)
        if target.startswith("refs/tags/"):
            return ["<all>"]
        out.append(target)
    return out


def push_protected(cmd):
    for seg in segments(cmd):
        sub, args = git_sub(seg)
        if sub == "push":
            for target in push_targets(args):
                if target == "<all>" or PROTECTED.match(target):
                    return True
    return False


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ("commit-set", "push-protected"):
        print(__doc__, file=sys.stderr)
        return 64
    try:
        if sys.argv[1] == "commit-set":
            for path in sorted(commit_set(sys.argv[2])):
                print(path)
        else:
            print("yes" if push_protected(sys.argv[2]) else "no")
    except (Unknown, subprocess.TimeoutExpired, OSError):
        print(UNKNOWN)
    return 0


if __name__ == "__main__":
    sys.exit(main())
