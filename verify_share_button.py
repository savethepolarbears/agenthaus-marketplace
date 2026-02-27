import asyncio
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        # Create a new context with clipboard permissions
        context = await browser.new_context(permissions=['clipboard-read', 'clipboard-write'])
        page = await context.new_page()

        try:
            # Navigate to a plugin page
            # Using 'sql-explorer' as it is likely a valid slug, or falling back to the first one found in the list if possible.
            # Based on file exploration, we don't have the list of static plugins readily available in a simple list format without reading the file.
            # Let's try to find a link from the home page first.
            await page.goto("http://localhost:3000")

            # Wait for grid to load
            await page.wait_for_selector("a[href^='/plugins/']")

            # Click the first plugin
            await page.click("a[href^='/plugins/']")

            # Wait for navigation
            await page.wait_for_load_state("networkidle")

            # Find the Share button
            share_button = page.get_by_role("button", name="Share")

            # Take a screenshot before interaction
            await page.screenshot(path="before_share.png")

            # Click the share button
            await share_button.click()

            # Wait for "Copied!" text or "Sharing..." text
            # Since we are in a headless environment without navigator.share, it should fallback to clipboard and show "Copied!"
            # The spinner might show briefly.

            # We want to capture the "Copied!" state.
            await expect(page.get_by_text("Copied!")).to_be_visible()

            # Take a screenshot of the "Copied!" state
            await page.screenshot(path="after_share.png")

            print("Verification successful: 'Copied!' state visible.")

        except Exception as e:
            print(f"Verification failed: {e}")
            await page.screenshot(path="error_state.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
