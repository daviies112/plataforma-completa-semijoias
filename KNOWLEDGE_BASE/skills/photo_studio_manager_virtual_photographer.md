---
name: Photo Studio Manager (Virtual Photographer)
description: Protocol for managing the "Photo Platform", including image enhancement, 9-photo generation, and background removal.
---

# Photo Studio Manager Protocol ðŸ“¸

**Objective:** "Professional Photos, Zero Cameras."

## 1. The Enhancement Suite âœ¨
*   **Feature:** "Melhorar Foto" (Free Service).
*   **Process:**
    1.  User uploads a raw photo of a jewelry piece.
    2.  Agent sends to `external_design_arsenal` (or specific Vision API).
    3.  **Action:** Adjust lighting, remove noise, sharpen details.
    4.  **Output:** Return high-res image to User.

## 2. The "9-Photo" Generator ðŸ–¼ï¸
*   **Feature:** Convert 1 photo into 9 varied marketing assets.
*   **Trigger:** User pays for the service (or Reseller Perk).
*   **Variations Generated:**
    1.  White Background (E-commerce standard).
    2.  Model Wearing (AI Face Swap/Generation).
    3.  Lifestyle (On a table with coffee).
    4.  Zoom Detail (Macro shot).
    5.  Instagram Story (9:16 format).
*   **Delivery:** Zip file sent via WhatsApp (`evolution_api_manager`).

## 3. Asset Organization ðŸ“‚
*   **Storage:** Save all generated assets in Supabase Storage bucket `photo-assets`.
*   **Tagging:** Auto-tag with product ID (`product_id`) for easy retrieval by `jewelry_catalog_manager`.