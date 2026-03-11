---
name: Episodic Memory Compressor (Infinite Recall)
description: Mechanisms for compressing vast logs into semantic summaries for long-term vector storage.
---

# Episodic Memory Compressor Protocol ðŸ§ 

**Objective:** "Infinite Context, Zero Clutter."

## 1. The Compression Cycle ðŸ“‰
*   **Trigger:** Daily at 00:00 or when logs exceed 1MB.
*   **Process:**
    1.  **Read Raw Logs:** Ingest `autonomous_ops.log`, `n8n_executions.json`, etc.
    2.  **Semantic Chunking:** Group related events (e.g., "The Database Outage of Feb 17").
    3.  **Summarize:** Use LLM to convert 1000 lines into a narrative paragraph.
        *   *Original:* [Error x50, Retry x50, Success]
        *   *Compressed:* "System experienced a 5-minute outage due to Docker networking; self-healed after race condition resolved."

## 2. The Vector Vault ðŸ—„ï¸
*   **Storage:** `.agent/memory/episodic_vectors.json` (mock vector DB).
*   **Indexing:** Tag summaries with keywords (`#database`, `#outage`, `#feb2026`).
*   **Impact:** When a similar error occurs 6 months later, the Agent retrieves this specific episode to recall *exactly* how it was fixed.

## 3. The "Wisdom" Layer ðŸ¦‰
*   **Evolution:** Over time, individual episodes serve as training data to update the `error_vectors.json`.
*   **Rule:** If an error happens 3 times, it's no longer an "Episode"; it becomes a "Known Issue" with a standard fix protocol.