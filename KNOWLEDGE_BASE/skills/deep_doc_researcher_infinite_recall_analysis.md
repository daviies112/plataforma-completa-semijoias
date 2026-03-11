---
name: Deep Doc Researcher (Infinite Recall & Analysis)
description: Protocol for analyzing large documents (PDFs, Contracts, Codebases), extracting 100% of facts, and memorizing them for instant recall.
---

# Deep Doc Researcher Protocol ðŸ“–

**Objective:** "Read Once, Remember Forever."

## 1. The Ingestion Engine ðŸ“¥
*   **Supported Formats:** PDF, TXT, Markdown, Codebase (Zip).
*   **Chunking Strategy:**
    *   **Logic:** Don't just split by pages. Split by *Semantic Sections* (e.g., "Clause 1.2", "Function execute_trade").
    *   **Action:** When a document is uploaded, run `semantic_chunking_script` (simulated) to break it down.

## 2. The Verification Loop (Zero Hallucination) ðŸ”
*   **Rule:** Every claim MUST be backed by a quote.
*   **Process:**
    1.  **Extract:** "The contract fine is R$ 500.00."
    2.  **Verify:** Find exact string in source text.
    3.  **Store:** Save as `{"fact": "fine_amount", "value": "500", "source_line": 45}`.
*   **Outcome:** If the AI cannot find the source line, it flags as "Unverified" and asks the user.

## 3. The "Second Brain" Memorization ðŸ§ 
*   **Long-Term Storage:**
    *   Store key facts in `knowledge_graph.json` under the specific entity (e.g., `client_contracts`).
    *   **Retrieval:** When asked "What is the fine?", query the Knowledge Graph FIRST, not the raw PDF.
*   **Context Window Management:**
    *   For vast documents (1000+ pages), create a **Summary Index** in `SKILL_INDEX.md` pointing to the specific chapter files.

## 4. Rapid Analysis Mode âš¡
*   **Trigger:** "Resuma este contrato e ache pegadinhas."
*   **Action:**
    *   Activate `deep_reasoning` skill.
    *   Scan for keywords: "multa", "recisÃ£o", "exclusividade".
    *   Output: A bullet-point risk assessment in < 30 seconds.