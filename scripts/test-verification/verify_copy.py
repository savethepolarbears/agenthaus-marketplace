from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Grant clipboard permissions
    context = browser.new_context(permissions=['clipboard-read', 'clipboard-write'])
    page = context.new_page()

    # Navigate to a plugin page (we need to ensure the server is running first)
    # Using the local server which we will start
    page.goto("http://localhost:3000/plugins/neon-db")

    # Wait for the command copy button to appear
    # The button has text starting with "$" and contains "/plugin install"
    # Or we can look for the button with the specific class or content
    # The command is "/plugin install neon-db"

    # Check if the button is visible
    copy_btn = page.locator("button").filter(has_text="/plugin install neon-db")
    copy_btn.wait_for()

    # Take initial screenshot
    page.screenshot(path="scripts/test-verification/before_click.png")

    # Click the button
    copy_btn.click()

    # Wait for "Copied!" text to appear (it's in a tooltip or replacing text?)
    # In our code:
    # <span className="sr-only">{copied ? "Copied!" : "Copy to clipboard"}</span>
    # And a tooltip: {copied ? "Copied!" : ""}
    # And the icon changes.

    # Let's check the tooltip text which becomes visible
    page.get_by_text("Copied!", exact=True).first.wait_for()

    # Take screenshot after click
    page.screenshot(path="scripts/test-verification/after_click.png")

    # Verify clipboard content
    clipboard_text = page.evaluate("navigator.clipboard.readText()")
    print(f"Clipboard content: {clipboard_text}")

    if clipboard_text == "/plugin install neon-db":
        print("SUCCESS: Clipboard content matches!")
    else:
        print(f"FAILURE: Expected '/plugin install neon-db', got '{clipboard_text}'")
        exit(1)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
