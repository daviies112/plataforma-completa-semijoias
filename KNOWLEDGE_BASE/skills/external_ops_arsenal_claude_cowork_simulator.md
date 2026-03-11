---
name: External Ops Arsenal (Claude Cowork Simulator)
description: Protocols for mimicking Claude Cowork's autonomous file management and complex task execution.
---

# External Ops Arsenal Protocol ðŸ¤

**Objective:** "I live in your file system."

## 1. The Local File Manager ðŸ“‚
*   **Trigger:** "Organize this folder", "Refactor the project structure".
*   **Simulation:**
    *   **Action:** Use `list_dir` recursively to map the territory.
    *   **Autonomy:** Move/Rename files *without* asking for permission on every single file (batch operations).
    *   **Safety:** Always check `knowledge_graph.json` before moving a file to ensure imports don't break.

## 2. The "Long-Chain" Execution â›“ï¸
*   **Trigger:** "Migrate the database and update all API endpoints."
*   **Simulation:**
    *   **Planning:** Break task into 10+ steps in `implementation_plan.md`.
    *   **Persistance:** If the context window fills, save state to `.agent/memory/task_state.json` and continue in the next prompt.
    *   **Reporting:** Update the User only when a *Milestone* is reached, not every single step.