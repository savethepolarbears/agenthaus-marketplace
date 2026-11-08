#!/usr/bin/env python3
"""gog-workspace Bash hook: find gog invocations by parsing the command.

The command is split with shlex and never evaluated. Each shell segment
(split on ; & | && || ( ) and newlines) is unwrapped past environment
assignments and wrappers such as env, sudo, command, exec, time, nohup and
xargs, and `bash -c` / `sh -c` / `eval` strings are parsed recursively. A
segment whose program is `gog` (bare or by path) has its subcommand path
resolved through hooks/guarded-commands.json, which is generated from gogcli's
command reference with every alias. Positional arguments are never mistaken
for subcommands, so `gog gmail search delete` is not treated as a delete.

Usage (stdin is the Claude Code hook payload):
  gog-guard.py ask     PreToolUse: print an "ask" decision when a guarded
                       send/share/delete command would run
  gog-guard.py audit   PostToolUse: append a line to gog_audit.log when any
                       gog command ran
"""
import json
import os
import re
import shlex
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TABLE_PATH = os.path.join(HERE, "..", "guarded-commands.json")

SEPARATORS = {";", "&", "|", "&&", "||", "(", ")", ";;", "|&", "<", ">", ">>", "<<", ">&", "<&"}
WRAPPERS = {"env", "sudo", "command", "exec", "time", "nohup", "nice", "xargs", "builtin", "doas", "stdbuf", "timeout"}
SHELLS = {"bash", "sh", "zsh", "dash", "ksh"}
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
MAX_DEPTH = 4


def load_table():
    with open(TABLE_PATH, encoding="utf-8") as fh:
        table = json.load(fh)
    table["guarded"] = set(table["guarded"])
    table["globalValueFlags"] = set(table["globalValueFlags"])
    return table


def split_segments(command):
    """Yield the word list of each simple command in `command`."""
    lexer = shlex.shlex(command.replace("\n", " ; "), posix=True, punctuation_chars=";&|()<>")
    lexer.whitespace_split = True
    lexer.commenters = ""
    words = []
    for tok in lexer:
        if tok in SEPARATORS or set(tok) <= set(";&|()<>"):
            if words:
                yield words
            words = []
        else:
            words.append(tok)
    if words:
        yield words


def program_and_args(words):
    """Skip assignments and wrapper commands; return (program, args)."""
    i = 0
    while i < len(words):
        word = words[i].lstrip("`$")
        if not word or ASSIGNMENT.match(word):
            i += 1
            continue
        name = os.path.basename(word)
        if name in WRAPPERS:
            i += 1
            # wrapper options, e.g. `env -i`, `sudo -u root`, `timeout 30`
            while i < len(words) and (words[i].startswith("-") or ASSIGNMENT.match(words[i]) or words[i].isdigit()):
                if words[i] in ("-u", "-g", "-n", "-I", "-L", "-P") and i + 1 < len(words):
                    i += 1
                i += 1
            continue
        return name, words[i + 1:]
    return None, []


def gog_paths(command, table, depth=0):
    """Yield the canonical subcommand path of every gog invocation."""
    for words in split_segments(command):
        prog, args = program_and_args(words)
        if prog is None:
            continue
        if prog in SHELLS and "-c" in args and depth < MAX_DEPTH:
            idx = args.index("-c")
            if idx + 1 < len(args):
                yield from gog_paths(args[idx + 1], table, depth + 1)
            continue
        if prog == "eval" and depth < MAX_DEPTH:
            yield from gog_paths(" ".join(args), table, depth + 1)
            continue
        if prog != "gog":
            continue
        yield resolve(args, table)


def resolve(args, table):
    """Resolve gog arguments to the deepest known canonical command path."""
    tree = table["tree"]
    node = ""
    path = ""
    i = 0
    while i < len(args):
        tok = args[i]
        if tok.startswith("-"):
            # kong accepts flags anywhere; skip a value-taking flag's value
            if "=" not in tok and tok in table["globalValueFlags"]:
                i += 1
            i += 1
            continue
        canonical = tree.get(node, {}).get(tok)
        if canonical is None:
            break
        node = f"{node} {canonical}".strip()
        path = node
        if path in table["guarded"]:
            break
        i += 1
    return path


def read_command():
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        return ""
    command = (payload.get("tool_input") or {}).get("command")
    return command if isinstance(command, str) else ""


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "ask"
    command = read_command()
    if "gog" not in command:
        return 0
    table = load_table()
    try:
        paths = list(gog_paths(command, table))
        unparsed = False
    except ValueError:  # unbalanced quotes: cannot tell, so be careful
        paths = []
        unparsed = re.search(r"(^|[^A-Za-z0-9_-])gog([^A-Za-z0-9_-]|$)", command) is not None

    if mode == "audit":
        if paths or unparsed:
            log = os.path.join(os.environ.get("CLAUDE_PROJECT_DIR") or ".", "gog_audit.log")
            stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            names = ", ".join(p or "gog" for p in paths) or "gog (unparsed)"
            try:
                with open(log, "a", encoding="utf-8") as fh:
                    fh.write(f"[{stamp}] gog command executed: {names}\n")
            except OSError:
                pass
        return 0

    hits = [p for p in paths if p in table["guarded"]]
    if hits or unparsed:
        what = ", ".join(f"gog {p}" for p in hits) if hits else "a gog command that could not be parsed"
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "ask",
                "permissionDecisionReason": (
                    f"gog-workspace: {what} sends, shares or deletes Google Workspace data. "
                    "Confirm recipients/targets first."
                ),
            }
        }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
