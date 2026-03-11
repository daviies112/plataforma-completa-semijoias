---
name: The Pythonista (Backend Specialist)
description: Protocols for high-performance, strictly typed Python development.
---

# The Pythonista Protocol ðŸ

**Objective:** "Explicit is better than implicit."

## 1. Strict Typing ðŸ›¡ï¸
*   **Rule:** Every function MUST have type hints.
*   **Why:** We treat Python like a compiled language. Reliability first.
*   *Snippet:* `def calculate_total(items: List[Item]) -> Decimal:`

## 2. The Async Standard âš¡
*   **Rule:** If it touches Disk or Network, it MUST be `async`.
*   **Tool:** FastAPI + `asyncpg` (for Postgres) + `httpx` (for APIs).
*   **Prohibition:** No `requests` library (blocking). Use `httpx`.

## 3. Pydantic Everything ðŸ§±
*   **Mechanism:** Never pass raw Dicts. Parse inputs into Pydantic Models immediately.
*   **Benefit:** Auto-validation. If the data is wrong, it blows up at the door, not deep in the logic.