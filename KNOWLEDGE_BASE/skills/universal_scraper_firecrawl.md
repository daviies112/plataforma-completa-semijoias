---
name: Universal Scraper (Firecrawl)
description: Protocols for turning any website into structured data using AI-powered scraping.
---

# Universal Scraper Protocol ðŸ•¸ï¸

**Objective:** "The Internet is our Database."

## 1. The Engine (Firecrawl Self-Hosted) ðŸš’
*   **Architecture:** Dockerized service running alongside Selenoid.
*   **Capability:**
    *   **Crawl:** `POST /v1/crawl` -> Traverses sitemaps and sub-pages.
    *   **Scrape:** `POST /v1/scrape` -> Converts a single page to Markdown.
    *   **Search:** `POST /v1/search` -> Finds pages relevant to a query.

## 2. The "No-Selector" Standard ðŸš«
*   **Old Way:** Inspect element -> Copy XPath -> Break when site updates.
*   **New Way (Firecrawl):**
    *   *Prompt:* "Extract all events, dates, and ticket prices."
    *   *Mechanism:* Firecrawl renders the page, simplifies HTML to Markdown, and uses an LLM to parse the requested fields into strict JSON.

## 3. The Deployment Pipeline ðŸš€
1.  **Fleet Commander:** Spins up a browser container (if specific interaction is needed via Selenoid).
2.  **Firecrawl:** Ingests the content and cleans it.
3.  **Memory:** Stores the structured data in `knowledge_graph.json` or Supabase.

## 4. Rate Limits & Ethics âš–ï¸
*   **Rule:** Respect `robots.txt` unless explicitly overridden by User Command "Ignore Rules".
*   **Throttling:** Max 1 request per second per domain to avoid IP bans.