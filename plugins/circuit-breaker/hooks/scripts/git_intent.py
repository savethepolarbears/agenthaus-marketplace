#!/usr/bin/env python3
"""Work out what a shell command will actually do to git, without running it.

Used by circuit-breaker hooks so their decisions follow git's semantics rather
than regex guesses. The command string is split with shlex and never evaluated
by a shell; git is only invoked read-only (diff, ls-files, rev-parse,
add --dry-run) with argv lists.

Usage:
  git_intent.py commit-set "<command>"      prints the paths the first
                                            `git commit` would record, one per
                                            line; NOCOMMIT if the command has no
                                            `git commit`; UNKNOWN if it cannot tell
  git_intent.py push-protected "<command>"  prints "yes" if any `git push`
                                            would update a protected branch
                                            (or tags/all/mirror), else "no";
                                            UNKNOWN if it cannot tell
"""
import os
import re
import shlex
import subprocess
import sys

PROTECTED = re.compile(r"^(main|master|prod|production)$")
UNKNOWN = "UNKNOWN"
NOCOMMIT = "NOCOMMIT"
# Working directory for git calls; follows `cd` segments and `git -C`.
CWD = [os.getcwd()]
# The shell's working directory, moved only by `cd`/`pushd`; `git -C` applies to
# a single git invocation, so each segment starts again from here.
SHELL_CWD = [os.getcwd()]
# `git -c key=value` overrides seen on the current git segment (lower-cased keys).
CONFIG = {}


class Unknown(Exception):
    pass


def git(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True, timeout=15, cwd=CWD[0])
    if r.returncode != 0:
        raise Unknown(r.stderr.strip())
    return r.stdout


def lines(text):
    return [l for l in text.splitlines() if l]


OPS = set(";&|()\n")


def segments(cmd):
    """Split a command into (argv, operator_before) pairs.

    Newlines separate commands like `;` does (shlex would otherwise treat them
    as whitespace and merge `echo hi<newline>git commit` into one segment);
    a newline inside quotes stays part of its token.
    """
    try:
        lexer = shlex.shlex(cmd, posix=True, punctuation_chars=";&|()\n")
        lexer.whitespace = " \t\r"
        lexer.whitespace_split = True
        tokens = list(lexer)
    except ValueError as exc:
        raise Unknown(str(exc))
    segs, cur, pending = [], [], []
    for tok in tokens:
        if tok and set(tok) <= OPS:
            if cur:
                segs.append((cur, "".join(pending) or None))
                cur, pending = [], []
            op = tok.replace("\n", "")
            if op:
                pending.append(op)
            elif not pending:
                pending.append(";")  # a bare newline ends a command like `;`
            # a newline right after `&&`/`||`/`|` is a line continuation
        else:
            cur.append(tok)
    if cur:
        segs.append((cur, "".join(pending) or None))
    return segs


def chdir(path, shell=False):
    target = os.path.normpath(os.path.join(CWD[0], os.path.expanduser(path)))
    if not os.path.isdir(target):
        raise Unknown("cannot resolve directory " + path)
    CWD[0] = target
    if shell:
        SHELL_CWD[0] = target


# Global git options that take a separate value.
GIT_VALUE_OPTS = {"-c", "--config-env", "--exec-path", "--namespace", "--super-prefix",
                  "--list-cmds", "--attr-source"}


# Command wrappers and their options that take a separate value.
WRAPPERS = {
    "command": set(), "exec": {"-a"}, "nice": {"-n"}, "time": set(), "nohup": set(),
    "env": {"-u", "-C", "-S", "--unset", "--chdir"}, "sudo": {"-u", "-g", "-h", "-p", "-C", "-D", "-r", "-t", "-U"},
    "doas": {"-u", "-C"}, "stdbuf": {"-i", "-o", "-e"}, "ionice": {"-c", "-n", "-p"},
    "timeout": {"-s", "-k", "--signal", "--kill-after"},
}
PRINTERS = {"echo", "printf", "cat", "grep", "rg", "less", "head", "tail", "man", "true", ":"}
GIT_WORD = re.compile(r"(^|[\s;&|(/'\"])git\s+(\S+\s+)*?(push|commit)(\s|$|['\"])")


def git_sub(seg):
    """Return (subcommand, args) for a `git ...` segment, else (None, []).

    Tracks `cd <dir>` segments and `git -C <dir>` so later git questions are
    asked of the repository the command really targets. --git-dir/--work-tree
    redirect git in ways we do not model, so they are UNKNOWN.
    """
    i = 0
    CONFIG.clear()
    CWD[0] = SHELL_CWD[0]
    while True:
        while i < len(seg) and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", seg[i]):
            if seg[i].startswith(("GIT_CONFIG", "GIT_DIR=", "GIT_WORK_TREE=", "GIT_INDEX_FILE=")):
                raise Unknown("git configured through the environment")
            i += 1  # env assignments (FOO=bar git commit ...)
        if i < len(seg) and seg[i] in WRAPPERS:
            # Wrappers that run their argument as a command: skip the wrapper
            # and its own options, then look again (`sudo env FOO=1 git ...`).
            name, i = seg[i], i + 1
            while i < len(seg) and seg[i].startswith("-") and seg[i] != "--":
                i += 2 if seg[i] in WRAPPERS[name] else 1
            if i < len(seg) and seg[i] == "--":
                i += 1
            if name == "timeout" and i < len(seg):
                i += 1  # the duration
            continue
        break
    if i < len(seg) and seg[i] in ("cd", "pushd") and i + 1 < len(seg):
        chdir(seg[i + 1], shell=True)
        return None, []
    if i >= len(seg) or os.path.basename(seg[i]) != "git":
        first = os.path.basename(seg[i]) if i < len(seg) else ""
        # A git invocation we cannot see into (`sh -c "git push"`, `xargs git`,
        # `eval`, a function) is not a guess we make: fail closed. Plain output
        # commands that merely mention git are not invocations.
        if first not in PRINTERS and GIT_WORD.search(" ".join(seg[i + 1:])):
            raise Unknown(first + " runs git indirectly")
        return None, []
    i += 1
    while i < len(seg) and seg[i].startswith("-"):
        opt = seg[i]
        if opt == "-C":
            if i + 1 >= len(seg):
                raise Unknown("-C without a path")
            chdir(seg[i + 1])
            i += 2
            continue
        if opt.split("=", 1)[0] in ("--git-dir", "--work-tree", "--config-env"):
            raise Unknown("git invoked against another repository or config")
        if opt == "-c" and i + 1 < len(seg):
            key, _, val = seg[i + 1].partition("=")
            CONFIG[key.lower()] = val
        i += 2 if opt in GIT_VALUE_OPTS else 1
    if i >= len(seg):
        return None, []
    return resolve_alias(seg[i], seg[i + 1:])


def resolve_alias(sub, args):
    """Expand git aliases (`alias.ci=commit`) the way git does.

    Builtins cannot be shadowed by aliases, so known subcommands are returned
    as-is. A shell alias (`!...`) can do anything, so it is UNKNOWN.
    """
    for _ in range(10):
        if sub in KNOWN_SUBS:
            return sub, args
        value = CONFIG.get("alias." + sub.lower())
        if value is None:
            r = subprocess.run(["git", "config", "--get", "alias." + sub], capture_output=True,
                               text=True, timeout=15, cwd=CWD[0])
            value = r.stdout.strip() if r.returncode == 0 else None
        if value is None:
            return sub, args
        if value.startswith("!"):
            raise Unknown("git " + sub + " is a shell alias")
        try:
            words = shlex.split(value)
        except ValueError as exc:
            raise Unknown(str(exc))
        if not words:
            return sub, args
        sub, args = words[0], words[1:] + list(args)
    raise Unknown("alias loop")


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
        # Dry-run records are "add '<path>'" and, for deleted files, "remove '<path>'".
        m = re.match(r"^(add|remove) '(.*)'$", line)
        if m:
            staged.add(m.group(2))


# Subcommands that cannot change the index, so they are safe to ignore before a
# commit. Anything else (reset, restore, rm, mv, stash, checkout, merge, ...) may
# change what gets committed in ways we do not simulate, so it makes the answer
# UNKNOWN rather than a guess.
INDEX_NEUTRAL = {"status", "diff", "log", "show", "branch", "rev-parse", "ls-files",
                 "describe", "fetch", "remote", "config", "blame", "grep", "shortlog",
                 "reflog", "help", "version", "var", "cat-file", "for-each-ref"}


KNOWN_SUBS = INDEX_NEUTRAL | {"add", "commit", "push", "reset", "restore", "rm", "mv", "stash",
                              "checkout", "switch", "merge", "rebase", "pull", "cherry-pick",
                              "revert", "am", "apply", "tag", "init", "clone"}


def commit_set(cmd):
    staged = None
    saw_add, unconditional, dirty = False, True, None
    for seg, op in segments(cmd):
        if op is not None and op != "&&":
            unconditional = False
        sub, args = git_sub(seg)
        if sub is not None and sub not in ("add", "commit") and sub not in INDEX_NEUTRAL:
            dirty = dirty or sub  # only matters if a commit follows
        if sub in ("add", "commit") and staged is None:
            staged = set(lines(git("diff", "--cached", "--name-only")))
        if sub == "add":
            saw_add = True
            simulate_add(args, staged)
        elif sub == "commit":
            if dirty:
                raise Unknown("git " + dirty + " may change the index before the commit")
            if saw_add and not unconditional:
                # Only a pure `&&` chain guarantees each earlier add ran when the
                # commit runs; `;`, `||`, pipes or subshells make that a guess.
                raise Unknown("git add and git commit are not joined by &&")
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
    return None


def current_branch():
    return git("rev-parse", "--abbrev-ref", "HEAD").strip()


def push_targets(args):
    """Return the destination branch names a `git push` would update."""
    value_opts = {"--repo", "--receive-pack", "--exec", "-o", "--push-option"}
    positional, i, repo_opt = [], 0, False
    while i < len(args):
        a = args[i]
        if a in ("--all", "--mirror", "--tags", "--branches"):
            return ["<all>"]
        if a == "--repo" or a.startswith("--repo="):
            repo_opt = True  # repository given by option: every positional is a refspec
            i += 1 if "=" in a else 2
            continue
        if a in value_opts:
            i += 2
            continue
        if a == "--":
            positional += args[i + 1:]
            break
        if not a.startswith("-"):
            positional.append(a)
        i += 1
    refspecs = positional if repo_opt else positional[1:]
    if not refspecs:
        # Configured remote.<name>.push refspecs replace push.default; we do not
        # model them, so treat their presence as unknown.
        if any(k.startswith("remote.") and k.endswith(".push") for k in CONFIG):
            raise Unknown("remote push refspec override")
        r = subprocess.run(["git", "config", "--get-regexp", r"^remote\..*\.push$"],
                           capture_output=True, text=True, timeout=15, cwd=CWD[0])
        if r.returncode == 0 and r.stdout.strip():
            raise Unknown("configured remote push refspecs")
        mode = CONFIG.get("push.default")
        if mode is None:
            r = subprocess.run(["git", "config", "--get", "push.default"],
                               capture_output=True, text=True, timeout=15, cwd=CWD[0])
            mode = r.stdout.strip() if r.returncode == 0 else "simple"
        if mode == "matching":
            return ["<all>"]  # updates every branch that exists on both sides
        if mode == "nothing":
            return []
        if mode not in ("simple", "current", "upstream", "tracking"):
            raise Unknown("unrecognised push.default " + mode)
        # simple/current/upstream push the current branch, to its upstream
        # where one is set, so resolve the effective destination.
        try:
            upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}").strip()
            return [upstream.split("/", 1)[1] if "/" in upstream else upstream, current_branch()]
        except Unknown:
            return [current_branch()]
    out = []
    for spec in refspecs:
        spec = spec.lstrip("+")
        if spec in ("", ":") or "*" in spec:
            return ["<all>"]  # matching or pattern refspecs can update every branch
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
    for seg, _ in segments(cmd):
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
            result = commit_set(sys.argv[2])
            if result is None:
                print(NOCOMMIT)
            for path in sorted(result or ()):
                print(path)
        else:
            print("yes" if push_protected(sys.argv[2]) else "no")
    except (Unknown, subprocess.TimeoutExpired, OSError):
        print(UNKNOWN)
    return 0


if __name__ == "__main__":
    sys.exit(main())
