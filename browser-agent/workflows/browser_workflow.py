from typing import Dict, Any, List
from agents.planner import AgentPlanner
from agents.executor import ActionExecutor
from memory.memory_manager import MemoryManager

class BrowserWorkflow:
    def __init__(self):
        self.planner = AgentPlanner()
        self.executor = ActionExecutor()
        self.memory = MemoryManager()

    def run(self, goal: str, user_id: str = "default") -> Dict[str, Any]:
        context = self.memory.search(user_id, goal)
        context_str = str(context) if context else ""

        plan = self.planner.plan(goal, context_str)
        result = self.executor.execute(plan)

        self.memory.add(
            user_id,
            f"Goal: {goal}\nResult: {result['results'][-1]['result'] if result['results'] else 'completed'}",
            metadata={"goal": goal, "type": "browser_session"}
        )

        return {
            "goal": goal,
            "plan": plan,
            "execution": result["results"],
            "screenshots": result["screenshots"],
            "summary": self._summarize(result["results"])
        }

    def _summarize(self, results: List[Dict]) -> str:
        if not results:
            return "No actions performed"
        final = [r for r in results if r["action"] == "done"]
        if final:
            return final[0]["result"]
        return results[-1]["result"]

    def close(self):
        self.executor.close()
