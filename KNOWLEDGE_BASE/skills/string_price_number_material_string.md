---
# Firecrawl Protocol: The Data Harvester ðŸšœðŸ“‚

**Objective:** "The entire web is a clean database."

## 1. Agentic Crawling (Deep Scan) ðŸ•µï¸
*   **Trigger:** "Deep Research" task or "Catalog Update".
*   **Action:** 
    1.  Deploy `Firecrawl` to crawl the target domain up to Level 3 depth.
    2.  Filter: Only keep product pages, pricing tables, and technical specs.
    3.  Convert: Output 100% clean Markdown (no ads, no footers).

## 2. Structured Extraction (Schema Mapping) ðŸ“Š
*   **Workflow:**
    1.  Receive Markdown.
    2.  Apply Zod Schema: `{ product_name: string, price: number, material: string }`.
    3.  Return validated JSON directly to the "Catalog Manager".

## 3. Real-Time Indexing (RAG Injector) ðŸ’‰
*   **Integration:**
    1.  New crawled data is automatically chunked.
    2.  Embedded via `text-embedding-3-small`.
    3.  Upserted to `Supabase vector storage`.
    4.  Mem0 is updated with "Last Research Date" for that domain.

## 4. Anti-Bot Shield (Stealth Mode) ðŸ›¡ï¸
*   **Protocol:** Uses Firecrawl's built-in residential proxies and browser impersonation to bypass 99% of Cloudflare/WAF protections.
---

name: Mathpix Logic Protocol (The Logical Vision)
description: Protocol for advanced mathematical and geometric OCR. Extracts equations, diagrams, and financial models from images/PDFs with LaTeX precision.