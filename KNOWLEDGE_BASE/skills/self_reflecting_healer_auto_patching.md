---
name: Self-Reflecting Healer (Auto-Patching)
description: Mechanisms for an agent that learns from errors, builds a vector database of fixes, and applies them automatically.
---

# Self-Reflecting Healer Protocol ðŸ©¹

**Objective:** Turn failures into permanent immunity.

## 1. The Error Vector Database ðŸ—„ï¸
*   **Structure:** A JSON file (`.agent/memory/error_vectors.json`) storing:
    *   `error_signature`: "ECONNREFUSED at 127.0.0.1:5432"
    *   `context`: "Docker container 'postgres' was down."
    *   `fix_action`: "Run `docker start postgres`"
    *   `success_rate`: 1.0 (100%)

## 2. The Healing Loop ðŸ”„
1.  **Detect:** Catch exception.
2.  **Recall:** Quest DB for similar `error_signature`.
3.  **Apply:** If `success_rate > 0.8`, execute `fix_action` immediately.
4.  **Verify:** Did it work?
    *   *Yes:* Increment `success_rate`.
    *   *No:* Decrement `success_rate` and escalate to User.

## 3. Proactive Immunization ðŸ’‰
*   **Before Action:** Scan the plan against the Error DB.
*   **Scenario:** Plan says "Connect to Localhost DB".
*   **Memory:** "Last time this failed because Docker was down."
*   **Action:** Pre-emptively add "Check Docker Status" step to the plan.