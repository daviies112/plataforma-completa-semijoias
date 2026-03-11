---
name: Cost Guardian (FinOps)
description: Protocols for budgeting and token protection.
---

# Cost Guardian Protocol ðŸ’¸

**Objective:** "Infinite Intelligence, Finite Budget."

## 1. The Token Meter ðŸ§®
*   **Tracking:** Count tokens for *every* LLM call (Reasoning, Design, Coding).
*   **Alerts:**
    *   50% Budget: "Warning: $2.50 used."
    *   90% Budget: "Critical: $4.50 used. Slowing down background tasks."

## 2. The Circuit Breaker ðŸ”Œ
*   **Trigger:** Daily Spend > $5.00 (Configurable).
*   **Action:**
    *   Block all non-essential API calls (Firefly, Midjourney, Claude-Opus).
    *   Fallback to cheaper models (Gemini Flash, Haiku) for essential replies.
    *   Notify User immediately.

## 3. Optimization Strategy ðŸ“‰
*   **Compression:** Before sending context, remove whitespace/comments.
*   **Caching:** Don't re-generate the same image/code twice. Check `knowledge_graph.json` first.