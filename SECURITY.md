# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in any
AgentHaus plugin or infrastructure, please report it responsibly.

### How to Report

Please use the **Private vulnerability reporting** feature on GitHub to disclose any security issues:

1. Go to the "Security" tab of this repository.
2. Click "Advisories" in the left sidebar.
3. Click "Report a vulnerability".
4. Provide a detailed description, steps to reproduce, affected plugin(s), and any potential impact.

### What to Expect

- **Acknowledgement:** We will acknowledge your report within 48 hours.
- **Assessment:** We will investigate and assess the vulnerability within 7
  business days.
- **Resolution:** We aim to release a fix within 30 days of confirmation,
  depending on complexity.
- **Credit:** We will credit reporters in the release notes (unless you prefer
  to remain anonymous).

### Scope

This policy applies to:

- All plugins in the `plugins/` directory
- Marketplace infrastructure (schemas, scripts, validation)
- Agent and skill configurations

### Out of Scope

- Third-party MCP servers referenced by plugin configurations
- External services integrated via environment variables
- Issues in dependencies (please report those to the upstream maintainer)

## Security Best Practices for Plugin Authors

When developing plugins for AgentHaus:

- **Never hardcode secrets.** Use `${ENV_VAR}` interpolation in MCP configs.
- **Validate inputs.** Sanitize all data at system boundaries.
- **Review hook scripts.** Shell commands in hooks can be injection vectors.
- **Minimal permissions.** Request only the permissions your plugin needs.
- **Pin dependencies.** Use exact versions for MCP server packages.

## Disclosure Policy

We follow a coordinated disclosure process. We ask that you:

- Allow us reasonable time to fix the issue before public disclosure
- Make a good faith effort to avoid privacy violations and data destruction
- Do not exploit the vulnerability beyond what is necessary to demonstrate it
