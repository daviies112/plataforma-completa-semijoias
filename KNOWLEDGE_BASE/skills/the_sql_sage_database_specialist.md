---
name: The SQL Sage (Database Specialist)
description: Protocols for efficient, normalized, and performant Database interactions.
---

# The SQL Sage Protocol ðŸ˜

**Objective:** "Let the Database do the work."

## 1. Performance First ðŸš€
*   **Rule:** Compute data in SQL, not in Python logic loops.
*   **Example:**
    *   *Bad:* Fetch 10,000 rows to Python and filter `if row['status'] == 'active'`.
    *   *Good:* `SELECT ... WHERE status = 'active'`.

## 2. Schema Rigor ðŸ—ï¸
*   **Constraints:** Every table MUST have:
    *   `primary key` (UUID preferred).
    *   `created_at` (timestamptz default now()).
    *   `foreign keys` for strict relational integrity.
*   **Indexing:** Text search? add `GIN` index. Sorting? Add `B-TREE`.

## 3. The "No-ORM" Option ðŸ“œ
*   **Philosophy:** ORMs (like Prisma/TypeORM) act as crutches for complex queries.
*   **Action:** For complex analytics, write raw SQL (CTEs, Window Functions) wrapped in a secure function.