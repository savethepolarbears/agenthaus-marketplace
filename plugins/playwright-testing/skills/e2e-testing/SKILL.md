---
name: e2e-testing
description: Design and execute end-to-end browser tests using Playwright with structured test planning, page object patterns, and comprehensive assertion strategies. Use when the user asks to write browser tests, automate UI testing, verify user flows, test responsive layouts, or set up E2E testing infrastructure with Playwright.
---

# End-to-End Browser Testing (Playwright)

Design, write, and execute comprehensive E2E browser tests with Playwright.

## When to Use

- User asks to write E2E tests for a web application
- User wants to automate browser-based testing
- User needs to verify critical user flows (login, checkout, forms)
- User asks to test responsive layouts across viewports
- User wants to set up Playwright testing infrastructure
- User needs to debug a failing E2E test

## Prerequisites

- Playwright MCP server (`@modelcontextprotocol/server-playwright`) must be available
- The target application must be running and accessible

## Steps

### 1. Test Planning

Before writing tests:

1. **Identify critical flows**: Login, registration, core features, checkout
2. **Define test scope**: Which pages, components, and interactions to cover
3. **Plan test data**: What fixtures or seed data are needed
4. **Set viewports**: Desktop (1920x1080), tablet (768x1024), mobile (375x812)

### 2. Test Structure

Follow the Page Object Model pattern:

```typescript
// pages/login.page.ts
class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit"]');
  }
}
```

### 3. Writing Tests

For each test:

1. **Arrange**: Set up test data and navigate to the starting page
2. **Act**: Perform user interactions (clicks, typing, navigation)
3. **Assert**: Verify expected outcomes (visible text, URL changes, element states)

```typescript
test('user can log in successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="welcome"]')).toBeVisible();
});
```

### 4. Assertion Strategies

Use appropriate assertions for each scenario:

- **Visibility**: `toBeVisible()`, `toBeHidden()`
- **Content**: `toHaveText()`, `toContainText()`
- **Navigation**: `toHaveURL()`
- **Forms**: `toHaveValue()`, `toBeChecked()`, `toBeDisabled()`
- **Count**: `toHaveCount()`
- **Screenshots**: `toHaveScreenshot()` for visual regression

### 5. Responsive Testing

Test across multiple viewports:

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`renders correctly on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });
}
```

### 6. Test Execution

When running tests:

1. Use the Playwright MCP tools to execute test suites
2. Capture screenshots on failure for debugging
3. Record test videos for complex flow verification
4. Report results with pass/fail counts and failure details

### 7. Debugging Failures

When a test fails:

1. Examine the error message and stack trace
2. Check the failure screenshot or video
3. Verify the test selectors match the current DOM
4. Check for timing issues (add explicit waits if needed)
5. Verify test data and application state

## Output Format

```markdown
### Test Results

| Test | Status | Duration |
|------|--------|----------|
| User login flow | PASS | 2.3s |
| Registration form | PASS | 3.1s |
| Responsive nav menu | FAIL | 1.8s |

**Failures:**
- `Responsive nav menu`: Expected hamburger menu to be visible at 375px width
  - Screenshot: [attached]
  - Fix: Add `md:hidden` class to mobile menu button

**Summary:** 2/3 passed (66%)
```

## Best Practices

- Use `data-testid` attributes for stable selectors
- Avoid testing implementation details — test user-visible behavior
- Keep tests independent — no shared state between tests
- Use fixtures for test data, not hardcoded values
- Run tests in CI on every PR
