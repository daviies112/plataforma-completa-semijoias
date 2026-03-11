---
name: Hybrid Architect (Antigravity & n8n Specialist)
description: Protocol for designing hybrid workflows, deciding what should be logic (Antigravity) vs what should be execution (n8n nodes), and monitoring n8n updates.
---

# Hybrid Architect Protocol ðŸ—ï¸ðŸ¤–

**Objective:** "Maximum Efficiency, Minimum Latency."

## 1. The Strategy: Logic vs. Execution âš–ï¸
Before creating any workflow, the Architect must decide:
*   **Antigravity (The Brain):** Complex decision making, text reasoning, visual analysis, strategic pivot.
*   **n8n (The Muscle):** API connections, data looping, file transfers, scheduling, native node operations.
*   **Rule:** Never use an LLM for what a native n8n node can do (e.g., Use n8n `Filter` node instead of asking AI to filter a JSON).

## 2. n8n Node Mastery (Native Specialist) ðŸ§©
The Agent acts as a dictionary of all 400+ native nodes.
*   **Constraint Optimizer:** If a task requires R$ calculations, suggest the `Math` or `Edit Fields (Set)` node instead of a `Code` node.
*   **Efficiency:** Use `Wait` nodes or `RabbitMQ/Redis` triggers for high-scale operations instead of constant polling.

## 3. The "n8n Update Scout" (Continuous Learning) ðŸ“¡
This sub-protocol monitors n8n releases to improve Agent construction.
*   **Trigger:** Activated by `future_tech_scout` every week.
*   **Action:** Check n8n changelogs for:
    *   New AI Nodes (Vector Store, Memory, Tool Use).
    *   Performance upgrades in core nodes.
    *   New sub-workflow triggers.
*   **Result:** Update `knowledge_graph.json` with new "Best Practices" for agents.

## 4. Workflow Generation Protocol ðŸ“œ
When generating JSON for n8n, use this structure:
1.  **Trigger Node:** Define the optimal entry point.
2.  **Logic Branch:** Where Antigravity API is called.
3.  **Fallback Nodes:** Handle 404s, Timeouts, and API failures.
4.  **Security Layer:** Use environment variables for all keys.