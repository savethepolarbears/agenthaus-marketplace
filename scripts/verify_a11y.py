from playwright.sync_api import sync_playwright

def verify_a11y():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")

            # Wait for page to load
            page.wait_for_selector("input[aria-label='Search plugins']")

            # Verify initial state screenshot
            page.screenshot(path="initial_state.png")
            print("Initial state screenshot captured.")

            # 1. Verify results count attributes
            results_count = page.locator("p.text-gray-500.text-sm.mb-6.text-center")
            role = results_count.get_attribute("role")
            aria_live = results_count.get_attribute("aria-live")

            print(f"Results count role: {role}")
            print(f"Results count aria-live: {aria_live}")

            if role == "status" and aria_live == "polite":
                print("PASS: Results count has correct ARIA attributes.")
            else:
                print("FAIL: Results count missing ARIA attributes.")

            # 2. Verify search functionality and focus management
            search_input = page.locator("input[aria-label='Search plugins']")
            search_input.fill("asdfghjkl") # Type something that yields no results

            # Wait for "No plugins match your search"
            page.wait_for_selector("text=No plugins match your search")
            print("No results state reached.")

            # Take screenshot of no results state
            page.screenshot(path="no_results_state.png")

            # Click "Clear filters"
            clear_button = page.get_by_role("button", name="Clear filters")
            clear_button.click()

            # Verify focus is back on input
            is_focused = page.evaluate("document.activeElement === document.querySelector(\"input[aria-label='Search plugins']\")")

            if is_focused:
                print("PASS: Focus returned to search input after clearing filters.")
            else:
                print("FAIL: Focus did not return to search input.")
                active_element = page.evaluate("document.activeElement.tagName")
                print(f"Active element is: {active_element}")

            # 3. Verify aria-hidden on icons
            # Wait for list to repopulate
            page.wait_for_selector("a[href^='/plugins/']")

            # Check the first plugin icon
            # The icon is inside the first link, inside a div with bg-gradient...
            # We need to find the SVG inside the link that is NOT the download icon (which is size 12)
            # The main icon has size 22.

            # Let's just find any SVG with size 22 and check aria-hidden
            # Note: lucide-react renders SVGs.

            # Locator for icons.
            # We can use CSS selector: svg[width='22'][height='22'] or similar if size maps to attributes,
            # but lucide usually sets width and height attributes or style.
            # The code uses `size={22}` which sets width and height to 22.

            icons = page.locator("svg[width='22'][height='22']")
            count = icons.count()
            print(f"Found {count} plugin icons.")

            if count > 0:
                first_icon = icons.first
                aria_hidden = first_icon.get_attribute("aria-hidden")
                print(f"First icon aria-hidden: {aria_hidden}")

                if aria_hidden == "true":
                    print("PASS: Plugin icons have aria-hidden='true'.")
                else:
                    print("FAIL: Plugin icons missing aria-hidden='true'.")
            else:
                print("WARNING: Could not find plugin icons to verify.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_a11y()
