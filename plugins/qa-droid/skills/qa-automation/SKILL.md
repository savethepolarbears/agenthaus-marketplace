---
name: qa-automation
description: Automated QA workflow combining Playwright browser testing with Slack and Gmail result notifications and test report generation. Use when the user asks to run automated test suites with notification workflows, generate QA reports, set up test-notify pipelines, or implement continuous testing with stakeholder communication.
---

# QA Automation with Notifications

End-to-end automated testing with Playwright, plus Slack and Gmail notifications for test results.

## When to Use

- User asks to run tests and notify the team of results
- User wants automated QA with reporting to Slack or email
- User needs a complete test-and-notify pipeline
- User asks to generate and distribute QA reports
- User wants to set up continuous testing with stakeholder alerts

## Prerequisites

- `SLACK_TOKEN` and `SLACK_CHANNEL` — for Slack notifications
- `GMAIL_CREDS` — for email notifications
- Playwright MCP (local `playwright-local`) — for browser testing
- Slack MCP server (`@modelcontextprotocol/server-slack`) — for messaging
- Gmail MCP server (`@modelcontextprotocol/server-gmail`) — for email

## Steps

### 1. Test Suite Execution

Run the automated test suite:

1. **Identify tests**: Find test files matching `*.test.*` or `*.spec.*` patterns
2. **Configure browser**: Set up Playwright with appropriate browser and viewport
3. **Execute tests**: Run all tests, capturing results, screenshots, and timing
4. **Collect results**: Aggregate pass/fail counts, failure details, and artifacts

### 2. Report Generation

Generate a comprehensive QA report:

```markdown
# QA Test Report — [Date]

## Summary
- **Total Tests**: 45
- **Passed**: 42 (93.3%)
- **Failed**: 2 (4.4%)
- **Skipped**: 1 (2.2%)
- **Duration**: 3m 42s

## Failed Tests

### 1. checkout-flow.spec.ts > Payment form validation
- **Error**: Expected error message not displayed for invalid card
- **Screenshot**: [attached]
- **Suggested fix**: Check form validation logic in PaymentForm.tsx:78

### 2. responsive.spec.ts > Mobile navigation
- **Error**: Menu button not visible at 375px viewport
- **Screenshot**: [attached]
- **Suggested fix**: Add responsive breakpoint for nav toggle

## Environment
- Browser: Chromium 120
- Viewport: 1920x1080 (desktop), 375x812 (mobile)
- App URL: http://localhost:3000
```

### 3. Slack Notification

Send test results to the team Slack channel:

#### On Success
```
:white_check_mark: QA Tests Passed
• Tests: 45/45 passed
• Duration: 3m 42s
• Branch: feature/user-auth
• Report: [link to full report]
```

#### On Failure
```
:x: QA Tests Failed
• Tests: 42/45 passed (2 failed, 1 skipped)
• Failed:
  - checkout-flow.spec.ts > Payment form validation
  - responsive.spec.ts > Mobile navigation
• Branch: feature/user-auth
• Report: [link to full report]
```

### 4. Email Notification

For critical failures or scheduled reports, send via Gmail:

1. Format the report as a clean HTML email
2. Attach failure screenshots as inline images
3. Include a summary at the top with pass/fail metrics
4. List action items for failed tests
5. Send to the configured recipient list

### 5. SDET Agent Workflow

The SDET agent (`claude-3-7-sonnet` model) can autonomously:

1. Analyze code changes to determine which tests to run
2. Write new tests for uncovered functionality
3. Execute the test suite and collect results
4. Generate the QA report
5. Send notifications via Slack and Gmail
6. Suggest fixes for failing tests based on error analysis

## Output Format

Save reports to `reports/TEST_RESULTS_[date].md` following the project's report naming convention.

## Error Handling

- If Slack is unavailable, fall back to Gmail notification only
- If both notification channels fail, save the report locally and inform the user
- Capture screenshots for all failed tests automatically
- Retry flaky tests once before marking as failed
