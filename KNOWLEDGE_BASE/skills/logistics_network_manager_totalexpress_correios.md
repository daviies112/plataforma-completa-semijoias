---
name: Logistics Network Manager (TotalExpress/Correios)
description: Protocol for autonomous interaction with logistics carriers, tracking resolution, and delivery issue handling.
---

# Logistics Network Manager Protocol ðŸšš

**Objective:** "Zero Delivery Headaches."

## 1. Carrier Integration (TotalExpress & Correios) ðŸ“¦
*   **Tracking Monitor:**
    *   **Action:** Poll tracking APIs every 4 hours.
    *   **Alert:** If status remains "Parado" (Stuck) for >48h, trigger `Resolution Protocol`.
*   **API Interactions:**
    *   **TotalExpress:** Interact via N8n HTTP Request node configured with TotalExpress auth headers.
    *   **Correios:** Use public tracking APIs or paid gateways via N8n.

## 2. Autonomous Resolution Protocol ðŸ¤–
*   **Scenario:** "Cliente ralisou reclamaÃ§Ã£o de atraso."
*   **Action:**
    1.  **Check Status:** Is it actually late?
    2.  **Contact Carrier:** automated ticket opening or "Fale Conosco" form submission via `browser_fleet_commander`.
    3.  **Customer Update:** Send WhatsApp (`evolution_api_manager`) using the "Empathetic Support" persona:
        *   "OlÃ¡! Vi que seu pedido teve um imprevisto. JÃ¡ cobrei a transportadora e te aviso em 24h."

## 3. Reverse Logistics (Trocas/DevoluÃ§Ãµes) ðŸ”„
*   **Trigger:** "Quero devolver."
*   **Action:**
    1.  Generate "CÃ³digo de Postagem" via Carrier API.
    2.  Send PDF label to user via WhatsApp.
    3.  Monitor return shipment until "Delivered" at warehouse.