---
description: Check availability of Apple CLI backends (macnotesapp, remindctl/rem, shortcuts) and report system readiness.
---
Use the `apple-productivity` MCP tool `system_status` to check the availability of all Apple CLI backends.

**Present the results in a table:**

```
## Apple Workflows — System Status

| Component        | Status | Path / Details          |
|------------------|--------|-------------------------|
| Platform         | ...    | macOS / Linux / ...     |
| Shortcuts CLI    | ...    | /usr/bin/shortcuts      |
| Notes CLI        | ...    | path or not found       |
| macnotesapp (Py) | ...    | available / missing     |
| remindctl        | ...    | path or not found       |
| rem              | ...    | path or not found       |
| Active backend   | ...    | remindctl / rem / none  |
```

**After the table:**
- If all components are available, report "All systems ready."
- If any are missing, provide installation instructions:
  - macnotesapp: `uv tool install --python 3.13 macnotesapp`
  - remindctl: `brew install steipete/tap/remindctl`
  - rem: `curl -fsSL https://rem.sidv.dev/install | bash`
  - shortcuts: Built into macOS (no separate install needed)
- If the platform is not macOS, warn that this plugin requires macOS.
