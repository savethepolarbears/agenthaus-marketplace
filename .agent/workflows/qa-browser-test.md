---
description: Use the browser agent to QA test the web storefront for visual correctness
---

# QA Browser Test

Use the Browser Agent to verify the web storefront renders correctly.

## Step 1: Start Dev Server

1. Start the Next.js development server:

```bash
cd agenthaus-web && npm run dev
```

1. Wait for the server to be ready (look for "Ready" in output).

## Step 2: Full-Page Verification

1. Use the browser agent to navigate to `http://localhost:3000`
2. Verify the page loads without errors
3. Capture a full-page screenshot
4. Check that plugin cards are rendering in the catalog grid

## Step 3: Responsive Layout Testing

1. Resize the browser to mobile width (375px) and capture a screenshot
2. Resize to tablet width (768px) and capture a screenshot
3. Resize to desktop width (1920px) and capture a screenshot
4. Verify the layout adapts correctly at each breakpoint

## Step 4: Plugin Card Verification

1. Count the number of plugin cards visible on the page
2. Verify at least 20 plugins are displayed (we have 23)
3. Check that each card shows: name, description, category badge
4. Click on a plugin card and verify the detail view loads

## Step 5: Navigation Testing

1. Test all navigation links in the header/footer
2. Verify no broken links (404 pages)
3. Check that the search/filter functionality works if present

## Step 6: Save Results

1. Save all screenshots to `reports/` directory
2. Save the browser recording as `storefront_qa_test`
3. Create a brief test results summary

## Expected Outcomes

- All pages load without JavaScript errors
- Plugin catalog shows all 23 plugins
- Responsive layout works at mobile, tablet, and desktop widths
- No visual regressions in the storefront design
