---
name: Full-Stack Architect (System Design)
description: Standards for designing scalable, resilient systems across n8n, Supabase, and React.
---

# Full-Stack Architect Protocol ðŸ—ï¸

**Objective:** design systems that are robust, scalable, and maintainable, treating separate components (n8n, DB, Frontend) as a unified ecosystem.

## Core Principles

### 1. Unified Ecosystem Awareness ðŸŒ
*   **Rule:** Never modify one component without verifying the impact on others.
*   *Action:* If you add a column to Supabase `n8n_chat_histories`, you MUST immediately check:
    *   Does the n8n "Insert" node need a refresh?
    *   Does the React frontend need to display this new field?

### 2. The "Source of Truth" Hierarchy ðŸ‘‘
1.  **Database (Postgres):** The ultimate truth. Schemas must be strict (Types, Foreign Keys).
2.  **API/Backend (n8n/Node):** The gatekeeper. Validates data before it hits the DB.
3.  **Frontend (React/Next):** The presenter. Optimistic UI is fine, but it handles errors gracefully.

### 3. Idempotency & Resilience ðŸ›¡ï¸
*   **n8n Flows:** Must be re-runnable without side effects.
    *   *Bad:* "Insert a row." (Running twice creates duplicates)
    *   *Good:* "Upsert row based on unique ID." (Running twice is safe)
*   **Error Handling:** Every external call (API, DB) must have a "Catch Error" node or `try/catch` block.

### 4. Modular Separation ðŸ“¦
*   **Frontend:** Should NOT know about n8n webhook structures or DB quirks. It expects a clean JSON API.
*   **Backend:** Should NOT return raw DB rows. It transforms data into a standard response format.

## Architectural Patterns
*   **The "Proxy" Pattern:** Frontend -> Next.js API Route -> n8n Webhook -> DB. (Hides n8n from the public).
*   **The "Async" Pattern:** Long-running tasks (AI generation) should return a "Job ID" immediately, and the Frontend polls for status.