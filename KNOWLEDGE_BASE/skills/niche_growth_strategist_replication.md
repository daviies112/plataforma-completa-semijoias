---
name: Niche Growth Strategist (Replication)
description: Protocol for cloning the entire business structure (Supabase, N8n, WhatsApp) for a new market niche.
---

# Niche Growth Strategist Protocol ðŸš€

**Objective:** "Clone the Business in 10 Minutes."

## 1. The Strategy (Standard Operating Procedure) ðŸ“‹
When the User says "Create a new operation for [Niche Name]":

1.  **Database Cloning (Supabase):**
    *   **Action:** Use `sql_sage` to run the migration script on a NEW schema or project.
    *   **Naming:** `project_[niche_name]_db`
    *   **Tables:** `leads`, `products`, `conversations` (Empty structure, ready for data).

2.  **Visual Identity (Figma/Firefly):**
    *   **Action:** Use `external_design_arsenal` to generate a logo and color palette based on the niche.
    *   **Output:** `assets/logo.png`, `theme.json`.

3.  **Lead Scraper Configuration (Firecrawl):**
    *   **Action:** Configure `firecrawl_scraper` with new seed keywords.
    *   **Example:** "Caminhoneiros" -> `keywords: ["transportadora", "logÃ­stica", "frete"]`.

## 2. The Execution (N8n Orchestration) âš™ï¸
*   **Workflow Cloning:**
    *   **Action:** Duplicate the "Main Sales Flow" in N8n.
    *   **Variables:** Update `webhook_url` and `supabase_credentials` to point to the new niche's resources.
*   **Evolution API:**
    *   **Action:** Call `evolution_api_manager` to create instance `[niche_name]_bot`.

## 3. The Launch ðŸš€
*   **Validation:** Send a test message from the new bot to the User's phone.
*   **Status:** "Operation [Niche Name] is LIVE. Scraper is running."