from typing import List, Dict, Any
from playwright.sync_api import Page

class Scraper:
    def __init__(self, page: Page):
        self.page = page

    def extract_text(self) -> str:
        return self.page.inner_text("body")

    def extract_table(self, selector: str = "table") -> List[List[str]]:
        return self.page.evaluate(f"""(selector) => {{
            const table = document.querySelector(selector);
            if (!table) return [];
            return Array.from(table.rows).map(row =>
                Array.from(row.cells).map(cell => cell.innerText.trim())
            );
        }}""", selector)

    def extract_list(self, selector: str = "li") -> List[str]:
        return self.page.evaluate(f"""(selector) =>
            Array.from(document.querySelectorAll(selector)).map(el => el.innerText.trim())
        """, selector)

    def extract_structured(self, schema: Dict[str, str]) -> Dict[str, Any]:
        result = {}
        for key, selector in schema.items():
            elements = self.page.query_selector_all(selector)
            result[key] = [el.inner_text().strip() for el in elements]
        return result

    def extract_json_ld(self) -> List[Dict]:
        return self.page.evaluate("""() => {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            return Array.from(scripts).map(s => JSON.parse(s.textContent));
        }""")

    def extract_meta(self) -> Dict[str, str]:
        return self.page.evaluate("""() => {
            const metas = document.querySelectorAll('meta');
            const result = {};
            metas.forEach(m => {
                const name = m.getAttribute('name') || m.getAttribute('property');
                const content = m.getAttribute('content');
                if (name && content) result[name] = content;
            });
            return result;
        }""")
