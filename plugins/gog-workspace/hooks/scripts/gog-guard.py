#!/usr/bin/env python3
"""gog-workspace Bash hook: find gog invocations by parsing the command.

The command is split with shlex and never evaluated, then cut into shell
segments at ; & | && || ( ) < > and newlines. The scan deliberately does not
try to model shell grammar (wrappers, env assignments, `if`/`while`/`!`,
`timeout 30s`, `sudo -u x`, `ssh host '...'`): any word whose basename is
`gog` starts an invocation, wherever it appears in a segment, and any word
that itself contains whitespace and "gog" (a `bash -lc '...'`, `eval`, `su -c`
or `ssh` string) is parsed again as a command. Each invocation's subcommand
path is resolved through hooks/guarded-commands.json, which is generated from
gogcli's command reference with every alias, so positional arguments are never
mistaken for subcommands (`gog gmail search delete` is not a delete).

This errs toward asking: `echo gog gmail send` or `grep 'gog drive delete'`
also prompt. It is a confirmation prompt, not a security boundary: it catches
ordinary and common wrapped invocations (quoted spellings such as `g""og`,
env prefixes, wrappers, `sh -c`, command substitution), but a determined
shell construct can still avoid it. For hard guarantees, run gogcli with its
own `--gmail-no-send`, `--readonly` or `--enable-commands` flags.

Usage (stdin is the Claude Code hook payload):
  gog-guard.py ask     PreToolUse: print an "ask" decision when a guarded
                       send/share/delete command may run, or a
                       calendar change notifies attendees (--send-updates)
  gog-guard.py audit   PostToolUse: append a line to gog_audit.log for each
                       gog invocation in the command that just ran. The hook
                       sees only the command text, so this records what was
                       issued: a branch the shell skipped (`false && gog ...`)
                       is still logged, and `ssh host gog ...` without quotes
                       is not.
"""
import json
import os
import re
import shlex
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TABLE_PATH = os.path.join(HERE, "..", "guarded-commands.json")

SEPARATORS = set(";&|()<>")
# Words that may precede a program in command position (used by the audit
# log only; the "ask" scan does not depend on them).
LEADERS = {
    "if", "then", "else", "elif", "while", "until", "do", "!", "{", "time",
    "env", "sudo", "doas", "command", "builtin", "exec", "nohup", "nice", "timeout",
    "stdbuf", "xargs",
}
SHELLISH = {"bash", "sh", "zsh", "dash", "ksh", "eval", "ssh", "su", "sudo", "watch"}
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
DURATION = re.compile(r"^\d+(\.\d+)?[smhd]?$")
GOG_WORD = re.compile(r"(^|[^A-Za-z0-9_-])gog([^A-Za-z0-9_-]|$)")
QUOTING = re.compile(r"[\'\"\\]")


def mentions_gog(text):
    """True if `text` names gog once shell quoting is removed (`g""og`, `g\\og`)."""
    return GOG_WORD.search(QUOTING.sub("", text)) is not None
MAX_DEPTH = 6


def load_table():
    with open(TABLE_PATH, encoding="utf-8") as fh:
        table = json.load(fh)
    table["guarded"] = set(table["guarded"])
    table.setdefault("notify", {})
    table["globalValueFlags"] = set(table["globalValueFlags"])
    common = set(table["globalBoolFlags"])
    table["boolFlags"] = {node: common | set(flags) for node, flags in table["boolFlags"].items()}
    table["boolFlags"][""] = common
    return table


def split_segments(command):
    """Yield the word list of each simple command in `command`."""
    # A backslash-newline continues the line in the shell, so join it before
    # turning the remaining newlines into command separators.
    command = command.replace("\\\r\n", " ").replace("\\\n", " ")
    lexer = shlex.shlex(command.replace("\n", " ; "), posix=True, punctuation_chars=";&|()<>")
    lexer.whitespace_split = True
    lexer.commenters = ""
    words = []
    for tok in lexer:
        if set(tok) <= SEPARATORS:
            if words:
                yield words
            words = []
        else:
            words.append(tok)
    if words:
        yield words


def in_command_position(words, i):
    """True when every word before words[i] can precede a program."""
    for j, word in enumerate(words[:i]):
        prev = words[j - 1] if j else ""
        if (
            os.path.basename(word) in LEADERS
            or ASSIGNMENT.match(word)
            or word.startswith("-")
            or DURATION.match(word)
            # a wrapper option's separate value: `sudo -u root`, `sudo --user root`,
            # `timeout --signal TERM`, `env --unset FOO`
            or (prev.startswith("-") and "=" not in prev)
        ):
            continue
        return False
    return True


def gog_paths(command, table, depth=0, audit=False):
    """Yield the resolved subcommand path of every possible gog invocation.

    For "ask" the scan is deliberately broad: every `gog` word, every word
    after a `$` expansion, every segment start (the tail of `$(...) drive
    delete f1`) and every quoted string mentioning gog is tried. For "audit"
    only `gog` in command position counts, so `echo gog ...` is not logged.
    """
    for words in split_segments(command):
        if not audit:
            yield resolve(words, table, guarded_only=True)
        for i, word in enumerate(words):
            bare = word.lstrip("`$(\"'").rstrip("`)\"'")
            if os.path.basename(bare) == "gog":
                if not audit or in_command_position(words, i):
                    path = resolve(words[i + 1:], table)
                    flag = table["notify"].get(path)
                    if not audit and flag and sends_updates(words[i + 1:], flag):
                        path = f"{path} {flag}"  # e.g. calendar create --send-updates all
                    yield path
                if not audit:
                    # Also start from every top-level command word, so a flag
                    # whose value we misjudge (`-awork@x`, `-jv`, an unknown
                    # option) can never hide the guarded subcommand after it.
                    for k in range(i + 1, len(words)):
                        if words[k] in table["tree"][""]:
                            yield resolve(words[k:], table, guarded_only=True)
            elif not audit and ("$" in word or "`" in word):
                # the program name may come from an expansion: `$G`, `go$X`
                yield resolve(words[i + 1:], table, guarded_only=True)
            if depth < MAX_DEPTH and any(c.isspace() for c in word) and (
                mentions_gog(word)
                # `G=gog bash -c '$G drive delete f1'`: the program may be an expansion
                or (not audit and "$" in word and any(os.path.basename(w) in SHELLISH for w in words[:i]))
            ):
                if not audit or any(os.path.basename(w) in SHELLISH for w in words[:i]):
                    yield from gog_paths(word, table, depth + 1, audit)


def sends_updates(args, flag):
    """True if `flag` (default none) is given a value other than none."""
    for j, tok in enumerate(args):
        if tok == flag:
            value = args[j + 1] if j + 1 < len(args) else ""
        elif tok.startswith(flag + "="):
            value = tok.split("=", 1)[1]
        else:
            continue
        if value.lower() != "none":
            return True
    return False


def resolve(args, table, guarded_only=False):
    """Resolve gog arguments to a command path ("" when only flags follow).

    A flag takes a value unless the snapshot lists it as boolean at the
    current node, so command-level flags such as `keep --impersonate x`
    are skipped with their value. With guarded_only, return "" unless the
    path is guarded (used for guesses such as segment starts).
    """
    tree = table["tree"]
    node = ""
    path = ""
    i = 0
    while i < len(args):
        tok = args[i]
        if tok == "--":
            # end of options: kong still resolves subcommands from what follows
            i += 1
            continue
        if tok.startswith("-") and tok != "-":
            flag = tok.split("=", 1)[0]
            bools = table["boolFlags"].get(node) or table["boolFlags"][""]
            attached = "=" in tok or (not tok.startswith("--") and len(tok) > 2)
            # `-awork@x` carries its value and `-jv` bundles booleans: neither
            # takes the next word.
            if not attached and flag not in bools:
                i += 1  # skip the flag's value
            i += 1
            continue
        canonical = tree.get(node, {}).get(tok)
        if canonical is None:
            # Not on a guarded path. Keep the word as a label for the audit
            # log; it can never equal a guarded path.
            path = f"{node} {tok}".strip()
            break
        node = f"{node} {canonical}".strip()
        path = node
        if path in table["guarded"] or node not in tree:
            break
        i += 1
    if guarded_only and path not in table["guarded"]:
        return ""
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
    if not command.strip():
        return 0
    table = load_table()
    try:
        paths = list(gog_paths(command, table, audit=(mode == "audit")))
        unparsed = False
    except ValueError:  # unbalanced quotes: cannot tell, so be careful
        paths = []
        unparsed = mentions_gog(command)

    if mode == "audit":
        if any(paths) or unparsed:
            log = os.path.join(os.environ.get("CLAUDE_PROJECT_DIR") or ".", "gog_audit.log")
            stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            names = ", ".join(p for p in paths if p) or "gog (unparsed)"
            try:
                with open(log, "a", encoding="utf-8", newline="\n") as fh:
                    fh.write(f"[{stamp}] gog command executed: {names}\n")
            except OSError:
                pass
        return 0

    hits = [p for p in paths if p in table["guarded"] or p.rsplit(" ", 1)[0] in table["notify"]]
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
