# Plugin Auditor

Audit plugins for security risks before installation. Scans hook scripts for injection vulnerabilities, validates MCP server configurations, checks for hardcoded credentials, and produces a security report with a pass/fail verdict.

## Prerequisites

No external dependencies or environment variables required.

## Installation

```bash
/plugin install plugin-auditor
```

## Usage

### Quick Audit

```
/audit plugins/social-media
/audit ./path/to/any-plugin
```

Performs automated security checks and outputs a report with severity levels (Critical, Warning, Info) and a verdict (Pass, Review Recommended, Fail).

### Deep Security Review

For a thorough manual review, invoke the security-reviewer agent:

```
Use the security-reviewer agent to analyze plugins/devops-flow
```

The agent performs line-by-line analysis of hook scripts, MCP server trust assessment, instruction analysis for prompt injection risks, and supply chain evaluation.

## What Gets Checked

### Hook Scripts (Critical)
- Shell injection via unquoted variables
- Arbitrary code execution (eval, backticks)
- Network calls that could exfiltrate data
- File operations outside the project directory
- Environment variable leaking

### MCP Servers
- Package trust (known publishers vs unknown)
- Hardcoded credentials in server args
- Proper `${ENV_VAR}` interpolation for secrets

### Commands and Agents
- Instructions that bypass safety features
- References to external URLs
- Destructive operations without confirmation

### Configuration
- Valid plugin.json schema and semver versioning
- All referenced files exist
- Environment variables properly documented

## Architecture

```
commands/
  audit.md                      # Automated security scan command
agents/
  security-reviewer.md          # Deep analysis agent (sonnet model)
skills/
  audit-checks/
    SKILL.md                    # Systematic audit checklist with scoring
```

### Scoring System

| Category | Weight |
|----------|--------|
| Hook script security | 40% |
| MCP server trust | 25% |
| Environment variable safety | 15% |
| Manifest validation | 10% |
| External references | 10% |

### Verdicts

- **PASS**: Score >= 80%, no Critical findings
- **REVIEW RECOMMENDED**: Score 60-79% or any Warning findings
- **FAIL**: Score < 60% or any Critical finding
