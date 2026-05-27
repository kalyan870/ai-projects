import json
from typing import List, Dict, Any
from browser.launch import BrowserManager
from browser.actions import BrowserActions
from browser.scraper import Scraper

class ActionExecutor:
    def __init__(self):
        self.browser = BrowserManager(headless=False)
        self.page = self.browser.start()
        self.actions = BrowserActions(self.page)
        self.scraper = Scraper(self.page)
        self.results = []
        self.screenshots = []

    def execute(self, plan: List[Dict[str, Any]]) -> Dict[str, Any]:
        for step in plan:
            action = step["action"]
            params = step.get("params", {})

            try:
                if action == "navigate":
                    self.actions.navigate(params["url"])
                    self._record(action, params, "navigated")

                elif action == "search_google":
                    self.actions.search_google(params["query"])
                    self._record(action, params, "searched")

                elif action == "click":
                    self.actions.click(params["selector"])
                    self._record(action, params, "clicked")

                elif action == "fill":
                    self.actions.fill(params["selector"], params["value"])
                    self._record(action, params, "filled")

                elif action == "extract_text":
                    text = self.scraper.extract_text()
                    self._record(action, params, text[:1000])

                elif action == "extract_table":
                    table = self.scraper.extract_table(params.get("selector", "table"))
                    self._record(action, params, json.dumps(table[:50]))

                elif action == "extract_list":
                    items = self.scraper.extract_list(params.get("selector", "li"))
                    self._record(action, params, json.dumps(items[:100]))

                elif action == "scroll":
                    self.actions.scroll_to_bottom()
                    self._record(action, params, "scrolled")

                elif action == "screenshot":
                    path = self.browser.screenshot(f"screenshots/step_{len(self.results)}.png")
                    self.screenshots.append(path)
                    self._record(action, params, path)

                elif action == "done":
                    self._record(action, params, params.get("summary", "completed"))
                    break

            except Exception as e:
                self._record(action, params, f"ERROR: {str(e)}")

        return {
            "results": self.results,
            "screenshots": self.screenshots,
            "final_state": self._get_state()
        }

    def _record(self, action: str, params: Dict, result: str):
        self.results.append({
            "action": action,
            "params": params,
            "result": result
        })

    def _get_state(self) -> str:
        try:
            return self.page.url
        except:
            return "closed"

    def close(self):
        self.browser.close()
