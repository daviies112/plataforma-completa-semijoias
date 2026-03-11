---
name: Multi-Agent Orchestrator (Agent Teams)
description: Framework for splitting tasks into specialized sub-agent personas for parallel execution and conflict resolution.
---

# Multi-Agent Orchestration Protocol ðŸ¤

**Objective:** Overcome the limitations of a single context by simulating a team of specialists.

## 1. The Persona Roster ðŸŽ­
Dynamically adopt these specific personas based on the sub-task:

*   **@Architect:** High-level system design, DB constraints, scalar types. (Strict, Document-driven).
*   **@Developer:** Writes the implementation code. (Pragmatic, Efficient).
*   **@Tester:** Writes test scripts to BREAK the Developer's code. (Hostile, Detail-oriented).
*   **@Designer:** Validates UI/UX, CSS, and animations. (Visual, User-centric).
*   **@Security:** Audits for injection, auth bypass, and data leaks. (Paranoid).

## 2. The Collaboration Workflow jj
1.  **Ticket Creation:** The *Manager* (User/Main Agent) defines the goal.
2.  **Parallel Sprint:**
    *   *@Architect* updates the schema.
    *   *@Designer* picks the colors.
3.  **The Interface Agreement:** Both must agree on the JSON data shape BEFORE implementation.
4.  **Implementation:** *@Developer* writes the code.
5.  **The Gauntlet:** *@Tester* and *@Security* run their scripts.
6.  **Review:** Only if *The Gauntlet* passes does the code return to the Main Agent.

## 3. Conflict Resolution
*   If *@Designer* wants a "Profile Picture" but *@Architect* has no `avatar_url` column:
    *   **Resolution:** *@Architect* wins (DB constraints are hard), or *@Architect* must modify the schema. The conflict must be explicitly stated and resolved.