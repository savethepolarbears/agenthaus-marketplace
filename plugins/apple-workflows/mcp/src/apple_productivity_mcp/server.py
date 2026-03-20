from __future__ import annotations

import html
import json
import logging
import os
import shutil
import subprocess
import urllib.parse
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Literal

from mcp.server.fastmcp import FastMCP

try:
    import macnotesapp  # type: ignore
except Exception:  # pragma: no cover
    macnotesapp = None


mcp = FastMCP("apple-productivity")
logger = logging.getLogger(__name__)


# ---------- Helpers ----------

class ToolError(RuntimeError):
    pass


@dataclass
class ReminderBackend:
    name: str
    binary: str


def _run_cmd(cmd: list[str], *, input_text: str | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    logger.debug("Running command: %s", cmd)
    proc = subprocess.run(
        cmd,
        input=input_text,
        text=True,
        capture_output=True,
        check=False,
    )
    if check and proc.returncode != 0:
        raise ToolError(
            f"Command failed ({proc.returncode}): {' '.join(cmd)}\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        )
    return proc


def _safe_json_loads(text: str, *, context: str) -> Any:
    try:
        return json.loads(text)
    except Exception as exc:
        raise ToolError(f"Failed to parse JSON from {context}: {exc}\nRaw output:\n{text}") from exc


def _which(binary: str) -> str | None:
    return shutil.which(binary)


def _require_shortcuts() -> str:
    binary = _which("shortcuts")
    if not binary:
        raise ToolError("Apple Shortcuts CLI (`shortcuts`) was not found in PATH.")
    return binary


def _open_url(url: str) -> dict[str, Any]:
    open_bin = _which("open")
    if not open_bin:
        raise ToolError("macOS `open` command not found.")
    proc = _run_cmd([open_bin, url], check=False)
    return {
        "ok": proc.returncode == 0,
        "exit_code": proc.returncode,
        "url": url,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
    }


def _notes_cli_binary() -> str | None:
    for candidate in ("notes", "macnotesapp"):
        found = _which(candidate)
        if found:
            return found
    return None


def _get_reminder_backend() -> ReminderBackend:
    forced = os.environ.get("APPLE_REMINDERS_BACKEND", "").strip().lower()
    candidates: list[ReminderBackend] = []

    if forced:
        path = _which(forced)
        if not path:
            raise ToolError(
                f"APPLE_REMINDERS_BACKEND={forced!r} was requested but that binary is not in PATH."
            )
        return ReminderBackend(name=forced, binary=path)

    remindctl = _which("remindctl")
    rem = _which("rem")
    if remindctl:
        candidates.append(ReminderBackend(name="remindctl", binary=remindctl))
    if rem:
        candidates.append(ReminderBackend(name="rem", binary=rem))

    if not candidates:
        raise ToolError(
            "No Reminders backend found. Install `remindctl` or `rem`, or set APPLE_REMINDERS_BACKEND."
        )
    return candidates[0]


def _normalize_note_body(body: str, body_format: Literal["plain", "html"]) -> str:
    if body_format == "plain":
        return body
    return f"<html><body>{html.escape(body).replace(chr(10), '<br/>')}</body></html>"


def _notes_app() -> Any:
    if macnotesapp is None:
        raise ToolError(
            "macnotesapp Python package is not available in this environment. Install it with `uv add macnotesapp`."
        )
    try:
        return macnotesapp.NotesApp()
    except AttributeError:
        return macnotesapp.App()


def _serialize_note(note: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {}
    for attr in [
        "id",
        "name",
        "title",
        "body",
        "plaintext",
        "folder",
        "account",
        "creation_date",
        "modification_date",
        "password_protected",
    ]:
        if hasattr(note, attr):
            value = getattr(note, attr)
            if hasattr(value, "name"):
                try:
                    value = value.name
                except Exception:
                    pass
            payload[attr] = value
    if "title" not in payload and "name" in payload:
        payload["title"] = payload["name"]
    return payload


def _note_identifier_matches(note_payload: dict[str, Any], ref: str) -> bool:
    ref_l = ref.lower()
    return any(
        isinstance(v, str) and (v.lower() == ref_l or v.lower().startswith(ref_l))
        for v in (note_payload.get("id"), note_payload.get("title"), note_payload.get("name"))
    )


def _all_notes() -> list[Any]:
    app = _notes_app()
    for candidate in ("notes", "all_notes", "get_notes"):
        if hasattr(app, candidate):
            value = getattr(app, candidate)
            notes = value() if callable(value) else value
            return list(notes)
    raise ToolError("Unable to enumerate notes via installed macnotesapp API.")


def _find_note(ref: str) -> dict[str, Any]:
    matches = [_serialize_note(n) for n in _all_notes() if _note_identifier_matches(_serialize_note(n), ref)]
    if not matches:
        raise ToolError(f"No note matched reference: {ref}")
    if len(matches) > 1:
        return {
            "ambiguous": True,
            "matches": matches,
        }
    return matches[0]


def _notes_cli_fallback(args: list[str]) -> dict[str, Any]:
    binary = _notes_cli_binary()
    if not binary:
        raise ToolError("No Notes CLI fallback found (`notes` or `macnotesapp`).")
    proc = _run_cmd([binary, *args], check=False)
    return {
        "ok": proc.returncode == 0,
        "exit_code": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
        "command": [binary, *args],
    }


def _normalize_reminder_payload(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, dict):
        if "reminders" in payload and isinstance(payload["reminders"], list):
            payload = payload["reminders"]
        else:
            payload = [payload]
    if not isinstance(payload, list):
        raise ToolError(f"Unexpected reminder payload type: {type(payload)!r}")

    normalized: list[dict[str, Any]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        normalized.append(
            {
                "id": item.get("id") or item.get("uuid") or item.get("identifier"),
                "title": item.get("title") or item.get("name"),
                "notes": item.get("notes") or item.get("note"),
                "list": item.get("list") or item.get("listName") or item.get("group"),
                "due": item.get("due") or item.get("dueDate") or item.get("due_date"),
                "completed": item.get("completed") or item.get("isCompleted") or False,
                "priority": item.get("priority"),
                "raw": item,
            }
        )
    return normalized


def _fetch_all_reminders(backend: ReminderBackend) -> list[dict[str, Any]]:
    if backend.name == "remindctl":
        proc = _run_cmd([backend.binary, "show", "--all", "--json"])
        return _normalize_reminder_payload(_safe_json_loads(proc.stdout, context="remindctl show --all --json"))

    proc = _run_cmd([backend.binary, "list", "-o", "json"])
    return _normalize_reminder_payload(_safe_json_loads(proc.stdout, context="rem list -o json"))


def _parse_due_date(value: str | None) -> datetime | None:
    if not value:
        return None
    value = value.strip()
    for parser in (
        lambda s: datetime.fromisoformat(s.replace("Z", "+00:00")),
        lambda s: datetime.strptime(s, "%Y-%m-%d"),
        lambda s: datetime.strptime(s, "%Y-%m-%d %H:%M"),
    ):
        try:
            dt = parser(value)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            continue
    return None


def _filter_reminders(
    reminders: Iterable[dict[str, Any]],
    *,
    view: str,
    list_name: str | None,
    query: str | None,
) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    today = now.date()
    tomorrow = (now + timedelta(days=1)).date()
    week_end = (now + timedelta(days=7)).date()

    def matches(rem: dict[str, Any]) -> bool:
        if list_name and (rem.get("list") or "").lower() != list_name.lower():
            return False
        if query:
            blob = f"{rem.get('title', '')}\n{rem.get('notes', '')}".lower()
            if query.lower() not in blob:
                return False

        due_dt = _parse_due_date(rem.get("due"))
        due_date = due_dt.date() if due_dt else None
        completed = bool(rem.get("completed"))

        if view == "all":
            return True
        if view == "completed":
            return completed
        if completed:
            return False
        if view == "today":
            return due_date == today
        if view == "tomorrow":
            return due_date == tomorrow
        if view == "week":
            return due_date is not None and today <= due_date <= week_end
        if view == "overdue":
            return due_date is not None and due_date < today
        if view == "upcoming":
            return due_date is None or due_date >= today
        return True

    return [r for r in reminders if matches(r)]


def _resolve_reminder(ref: str, reminders: list[dict[str, Any]]) -> dict[str, Any]:
    ref_l = ref.lower()
    matches = [
        r
        for r in reminders
        if any(
            isinstance(val, str) and (val.lower() == ref_l or val.lower().startswith(ref_l))
            for val in (r.get("id"), r.get("title"))
        )
    ]
    if not matches:
        raise ToolError(f"No reminder matched reference: {ref}")
    if len(matches) > 1:
        return {"ambiguous": True, "matches": matches}
    return matches[0]


def _run_reminder_mutation(cmd: list[str]) -> dict[str, Any]:
    proc = _run_cmd(cmd, check=False)
    return {
        "ok": proc.returncode == 0,
        "exit_code": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
        "command": cmd,
    }


# ---------- General ----------

@mcp.tool()
def system_status() -> dict[str, Any]:
    """Report whether the required Apple CLIs/backends are available."""
    return {
        "platform": os.uname().sysname,
        "shortcuts": _which("shortcuts"),
        "notes_cli": _notes_cli_binary(),
        "remindctl": _which("remindctl"),
        "rem": _which("rem"),
        "macnotesapp_python": macnotesapp is not None,
        "forced_reminders_backend": os.environ.get("APPLE_REMINDERS_BACKEND"),
    }


# ---------- Notes ----------

@mcp.tool()
def notes_accounts() -> dict[str, Any]:
    """List Apple Notes accounts available through macnotesapp."""
    app = _notes_app()
    accounts: list[str] = []
    if hasattr(app, "accounts"):
        raw = getattr(app, "accounts")
        raw_accounts = raw() if callable(raw) else raw
        for acct in raw_accounts:
            accounts.append(getattr(acct, "name", str(acct)))
    elif hasattr(app, "folders"):
        seen: set[str] = set()
        raw = getattr(app, "folders")
        raw_folders = raw() if callable(raw) else raw
        for folder in raw_folders:
            acct = getattr(folder, "account", None)
            name = getattr(acct, "name", None) if acct else None
            if name and name not in seen:
                seen.add(name)
                accounts.append(name)
    return {"accounts": accounts}


@mcp.tool()
def notes_folders(account: str | None = None) -> dict[str, Any]:
    """List Apple Notes folders, optionally filtered by account name."""
    app = _notes_app()
    if not hasattr(app, "folders"):
        raise ToolError("Installed macnotesapp API does not expose folders().")
    raw = getattr(app, "folders")
    folders = raw() if callable(raw) else raw
    results: list[dict[str, Any]] = []
    for folder in folders:
        acct = getattr(folder, "account", None)
        acct_name = getattr(acct, "name", None) if acct else None
        if account and (acct_name or "").lower() != account.lower():
            continue
        results.append(
            {
                "name": getattr(folder, "name", str(folder)),
                "id": getattr(folder, "id", None),
                "account": acct_name,
            }
        )
    return {"folders": results}


@mcp.tool()
def notes_search(query: str, limit: int = 20) -> dict[str, Any]:
    """Search Apple Notes by title/body text."""
    q = query.lower().strip()
    matches: list[dict[str, Any]] = []
    for note in _all_notes():
        payload = _serialize_note(note)
        blob = f"{payload.get('title', '')}\n{payload.get('body', '')}\n{payload.get('plaintext', '')}".lower()
        if q in blob:
            matches.append(payload)
        if len(matches) >= max(1, limit):
            break
    return {"query": query, "count": len(matches), "notes": matches}


@mcp.tool()
def notes_get(note_ref: str) -> dict[str, Any]:
    """Get one note by exact id, id prefix, or exact title."""
    return _find_note(note_ref)


@mcp.tool()
def notes_create(
    title: str,
    body: str,
    folder: str | None = None,
    account: str | None = None,
    body_format: Literal["plain", "html"] = "plain",
) -> dict[str, Any]:
    """Create a new Apple Note."""
    app = _notes_app()
    content = _normalize_note_body(body, body_format)

    for method_name in ("make_note", "create_note", "new_note"):
        if hasattr(app, method_name):
            method = getattr(app, method_name)
            try:
                note = method(title=title, body=content, folder=folder, account=account)
            except TypeError:
                try:
                    note = method(name=title, body=content, folder=folder, account=account)
                except TypeError:
                    continue
            return {"created": _serialize_note(note)}

    args = ["new", title, content]
    if folder:
        args += ["--folder", folder]
    if account:
        args += ["--account", account]
    return _notes_cli_fallback(args)


@mcp.tool()
def notes_update(
    note_ref: str,
    title: str | None = None,
    body: str | None = None,
    body_format: Literal["plain", "html"] = "plain",
) -> dict[str, Any]:
    """Update a note title and/or body."""
    if title is None and body is None:
        raise ToolError("Provide at least one field to update.")

    target = _find_note(note_ref)
    if target.get("ambiguous"):
        return target

    app = _notes_app()
    note_id = target.get("id") or note_ref

    for note in _all_notes():
        payload = _serialize_note(note)
        if payload.get("id") == note_id:
            if title is not None:
                for attr in ("title", "name"):
                    if hasattr(note, attr):
                        setattr(note, attr, title)
                        break
            if body is not None:
                normalized = _normalize_note_body(body, body_format)
                for attr in ("body", "plaintext"):
                    if hasattr(note, attr):
                        setattr(note, attr, normalized)
                        break
            for saver in ("save", "update"):
                if hasattr(note, saver):
                    maybe = getattr(note, saver)
                    if callable(maybe):
                        maybe()
                        return {"updated": _serialize_note(note)}
            return _notes_cli_fallback(
                [
                    "edit",
                    str(note_id),
                    *(["--title", title] if title is not None else []),
                    *(["--body", _normalize_note_body(body, body_format)] if body is not None else []),
                ]
            )

    raise ToolError(f"Failed to locate note for update: {note_ref}")


@mcp.tool()
def notes_move(note_ref: str, folder: str, account: str | None = None) -> dict[str, Any]:
    """Move a note to another folder."""
    target = _find_note(note_ref)
    if target.get("ambiguous"):
        return target
    note_id = target.get("id") or note_ref

    return _notes_cli_fallback(
        [
            "move",
            str(note_id),
            "--folder",
            folder,
            *(["--account", account] if account else []),
        ]
    )


@mcp.tool()
def notes_delete(note_ref: str, confirm: bool) -> dict[str, Any]:
    """Delete a note. Set confirm=True to allow destructive action."""
    if not confirm:
        raise ToolError("Deletion is blocked until you pass confirm=True.")
    target = _find_note(note_ref)
    if target.get("ambiguous"):
        return target
    note_id = target.get("id") or note_ref
    return _notes_cli_fallback(["delete", str(note_id), "--force"])


@mcp.tool()
def notes_create_folder(name: str, account: str | None = None) -> dict[str, Any]:
    """Create a new top-level Notes folder."""
    return _notes_cli_fallback(["folder", "create", name, *(["--account", account] if account else [])])


@mcp.tool()
def notes_delete_folder(name: str, confirm: bool, account: str | None = None) -> dict[str, Any]:
    """Delete a Notes folder. Set confirm=True to allow destructive action."""
    if not confirm:
        raise ToolError("Deletion is blocked until you pass confirm=True.")
    return _notes_cli_fallback(["folder", "delete", name, *(["--account", account] if account else []), "--force"])


# ---------- Reminders ----------

@mcp.tool()
def reminders_status() -> dict[str, Any]:
    """Return the selected Reminders backend and quick status info."""
    backend = _get_reminder_backend()
    payload: dict[str, Any] = {
        "selected_backend": backend.name,
        "binary": backend.binary,
        "available_backends": {
            "remindctl": shutil.which("remindctl"),
            "rem": shutil.which("rem"),
        },
    }
    if backend.name == "remindctl":
        proc = _run_cmd([backend.binary, "status"], check=False)
        payload["permission_status"] = proc.stdout.strip() or proc.stderr.strip()
    return payload


@mcp.tool()
def reminders_request_access() -> dict[str, Any]:
    """Trigger the Reminders permission prompt when supported by the backend."""
    backend = _get_reminder_backend()
    if backend.name == "remindctl":
        proc = _run_cmd([backend.binary, "authorize"], check=False)
        return {"backend": backend.name, "stdout": proc.stdout.strip(), "stderr": proc.stderr.strip()}
    return {
        "backend": backend.name,
        "message": "This backend does not expose an explicit authorize command. The first write operation should trigger the system permission prompt.",
    }


@mcp.tool()
def reminder_lists() -> dict[str, Any]:
    """List Reminder lists using the active backend."""
    backend = _get_reminder_backend()
    if backend.name == "remindctl":
        payload = _safe_json_loads(_run_cmd([backend.binary, "list", "--json"]).stdout, context="remindctl list --json")
        return {
            "backend": backend.name,
            "lists": payload,
        }

    proc = _run_cmd([backend.binary, "lists"], check=False)
    return {
        "backend": backend.name,
        "lists_text": proc.stdout.strip(),
    }


@mcp.tool()
def reminders_list(
    view: Literal["today", "tomorrow", "week", "overdue", "upcoming", "completed", "all"] = "today",
    list_name: str | None = None,
    query: str | None = None,
    limit: int = 50,
) -> dict[str, Any]:
    """List reminders, optionally filtered by view, list, or text query."""
    backend = _get_reminder_backend()
    reminders = _fetch_all_reminders(backend)
    filtered = _filter_reminders(reminders, view=view, list_name=list_name, query=query)
    return {
        "backend": backend.name,
        "view": view,
        "list": list_name,
        "query": query,
        "count": len(filtered[: max(limit, 1)]),
        "reminders": filtered[: max(limit, 1)],
    }


@mcp.tool()
def reminder_get(reminder_ref: str) -> dict[str, Any]:
    """Fetch one reminder by exact id, id prefix, or exact title."""
    backend = _get_reminder_backend()
    if backend.name == "rem":
        proc = _run_cmd([backend.binary, "get", reminder_ref, "-o", "json"], check=False)
        if proc.returncode == 0 and proc.stdout.strip():
            payload = _normalize_reminder_payload(_safe_json_loads(proc.stdout, context="rem get -o json"))
            if payload:
                return payload[0]

    reminders = _fetch_all_reminders(backend)
    return _resolve_reminder(reminder_ref, reminders)


@mcp.tool()
def reminders_add(
    title: str,
    list_name: str | None = None,
    due: str | None = None,
    notes: str | None = None,
    priority: str | None = None,
    url: str | None = None,
    flagged: bool = False,
) -> dict[str, Any]:
    """Create a reminder."""
    backend = _get_reminder_backend()

    if backend.name == "remindctl":
        cmd = [backend.binary, "add", "--title", title]
        if list_name:
            cmd += ["--list", list_name]
        if due:
            cmd += ["--due", due]
        if priority:
            cmd += ["--priority", priority]
        if notes:
            cmd += ["--notes", notes]
        if url:
            cmd += ["--url", url]
        if flagged:
            cmd += ["--flagged"]
        return _run_reminder_mutation(cmd)

    cmd = [backend.binary, "add", title]
    if list_name:
        cmd += ["--list", list_name]
    if due:
        cmd += ["--due", due]
    if priority:
        cmd += ["--priority", priority]
    if notes:
        cmd += ["--notes", notes]
    if url:
        cmd += ["--url", url]
    if flagged:
        cmd += ["--flagged"]
    return _run_reminder_mutation(cmd)


@mcp.tool()
def reminders_update(
    reminder_ref: str,
    title: str | None = None,
    due: str | None = None,
    notes: str | None = None,
    priority: str | None = None,
    url: str | None = None,
    list_name: str | None = None,
) -> dict[str, Any]:
    """Update a reminder."""
    backend = _get_reminder_backend()

    if backend.name == "remindctl":
        cmd = [backend.binary, "edit", reminder_ref]
        if title:
            cmd += ["--title", title]
        if due:
            cmd += ["--due", due]
        if priority:
            cmd += ["--priority", priority]
        if notes:
            cmd += ["--notes", notes]
        if url:
            cmd += ["--url", url]
        if list_name:
            cmd += ["--list", list_name]
        return _run_reminder_mutation(cmd)

    cmd = [backend.binary, "update", reminder_ref]
    if title:
        cmd += ["--name", title]
    if due:
        cmd += ["--due", due]
    if priority:
        cmd += ["--priority", priority]
    if notes:
        cmd += ["--notes", notes]
    if url:
        cmd += ["--url", url]
    if list_name:
        cmd += ["--list", list_name]
    return _run_reminder_mutation(cmd)


@mcp.tool()
def reminders_complete(reminder_ref: str) -> dict[str, Any]:
    """Mark a reminder complete."""
    backend = _get_reminder_backend()
    return _run_reminder_mutation([backend.binary, "complete", reminder_ref])


@mcp.tool()
def reminders_delete(reminder_ref: str, confirm: bool) -> dict[str, Any]:
    """Delete a reminder. Set confirm=True to allow destructive action."""
    if not confirm:
        raise ToolError("Deletion is blocked until you pass confirm=True.")
    backend = _get_reminder_backend()
    if backend.name == "remindctl":
        return _run_reminder_mutation([backend.binary, "delete", reminder_ref, "--force"])
    return _run_reminder_mutation([backend.binary, "rm", reminder_ref, "--force"])


@mcp.tool()
def reminder_list_create(name: str) -> dict[str, Any]:
    """Create a reminder list."""
    backend = _get_reminder_backend()
    if backend.name == "remindctl":
        return _run_reminder_mutation([backend.binary, "list", name, "--create"])
    return _run_reminder_mutation([backend.binary, "list-mgmt", "create", name])


@mcp.tool()
def reminder_list_rename(old_name: str, new_name: str) -> dict[str, Any]:
    """Rename a reminder list."""
    backend = _get_reminder_backend()
    if backend.name == "remindctl":
        return _run_reminder_mutation([backend.binary, "list", old_name, "--rename", new_name])
    return _run_reminder_mutation([backend.binary, "list-mgmt", "rename", old_name, new_name])


@mcp.tool()
def reminder_list_delete(name: str, confirm: bool) -> dict[str, Any]:
    """Delete a reminder list. Set confirm=True to allow destructive action."""
    if not confirm:
        raise ToolError("Deletion is blocked until you pass confirm=True.")
    backend = _get_reminder_backend()
    if backend.name == "remindctl":
        return _run_reminder_mutation([backend.binary, "list", name, "--delete"])
    return _run_reminder_mutation([backend.binary, "lm", "rm", name, "--force"])


# ---------- Shortcuts ----------

@mcp.tool()
def shortcuts_list(folder: str | None = None, folders_only: bool = False) -> dict[str, Any]:
    """List Shortcuts or Shortcut folders using Apple's built-in `shortcuts` CLI."""
    binary = _require_shortcuts()
    cmd = [binary, "list"]
    if folders_only:
        cmd.append("--folders")
    elif folder:
        cmd += ["-f", folder]
    proc = _run_cmd(cmd)
    items = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
    return {
        "folder": folder,
        "folders_only": folders_only,
        "count": len(items),
        "items": items,
    }


@mcp.tool()
def shortcuts_run(
    name: str,
    input_text: str | None = None,
    input_paths: list[str] | None = None,
    output_path: str | None = None,
    output_type: str | None = None,
) -> dict[str, Any]:
    """Run a Shortcut by name, optionally piping text input or passing file paths."""
    binary = _require_shortcuts()
    if input_text and input_paths:
        raise ToolError("Provide input_text or input_paths, not both.")

    cmd = [binary, "run", name]
    if input_paths:
        cmd += ["-i", *input_paths]
    if output_path:
        cmd += ["-o", output_path]
    if output_type:
        cmd += ["--output-type", output_type]

    proc = _run_cmd(cmd, input_text=input_text, check=False)
    return {
        "ok": proc.returncode == 0,
        "exit_code": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
        "output_path": output_path,
    }


@mcp.tool()
def shortcuts_view(name: str) -> dict[str, Any]:
    """Open a Shortcut in the Shortcuts editor using `shortcuts view`."""
    binary = _require_shortcuts()
    proc = _run_cmd([binary, "view", name], check=False)
    return {
        "ok": proc.returncode == 0,
        "exit_code": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
    }


@mcp.tool()
def shortcuts_create_new() -> dict[str, Any]:
    """Open the Shortcuts editor to create a brand-new Shortcut."""
    return _open_url("shortcuts://create-shortcut")


@mcp.tool()
def shortcuts_open(name: str) -> dict[str, Any]:
    """Open a specific Shortcut in the Shortcuts app using the official URL scheme."""
    encoded = urllib.parse.quote(name, safe="")
    return _open_url(f"shortcuts://open-shortcut?name={encoded}")


def main() -> None:
    transport = os.environ.get("APPLE_PRODUCTIVITY_MCP_TRANSPORT", "stdio").strip().lower()
    if transport not in {"stdio", "streamable-http"}:
        raise SystemExit("APPLE_PRODUCTIVITY_MCP_TRANSPORT must be 'stdio' or 'streamable-http'.")
    mcp.run(transport=transport)


if __name__ == "__main__":
    main()
