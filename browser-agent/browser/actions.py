from playwright.sync_api import Page
from typing import List, Dict, Any

class BrowserActions:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self, url: str):
        self.page.goto(url, wait_until="networkidle")

    def click(self, selector: str):
        self.page.click(selector)

    def fill(self, selector: str, value: str):
        self.page.fill(selector, value)

    def press_key(self, key: str):
        self.page.keyboard.press(key)

    def select_option(self, selector: str, value: str):
        self.page.select_option(selector, value)

    def get_text(self, selector: str) -> str:
        return self.page.text_content(selector) or ""

    def get_attribute(self, selector: str, attr: str) -> str:
        return self.page.get_attribute(selector, attr) or ""

    def wait_for_selector(self, selector: str, timeout: int = 5000):
        self.page.wait_for_selector(selector, timeout=timeout)

    def scroll_to_bottom(self):
        self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

    def execute_js(self, script: str):
        return self.page.evaluate(script)

    def get_all_links(self) -> List[Dict[str, str]]:
        return self.page.evaluate("""() =>
            Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.innerText.trim(),
                href: a.href
            }))
        """)

    def search_google(self, query: str):
        self.navigate("https://www.google.com")
        self.page.wait_for_selector("textarea[name='q']")
        self.fill("textarea[name='q']", query)
        self.press_key("Enter")
        self.page.wait_for_load_state("networkidle")

    def get_search_results(self) -> List[Dict[str, Any]]:
        return self.page.evaluate("""() =>
            Array.from(document.querySelectorAll('div.g')).map(result => ({
                title: result.querySelector('h3')?.innerText || '',
                url: result.querySelector('a')?.href || '',
                snippet: result.querySelector('.VwiC3b')?.innerText || ''
            }))
        """)
