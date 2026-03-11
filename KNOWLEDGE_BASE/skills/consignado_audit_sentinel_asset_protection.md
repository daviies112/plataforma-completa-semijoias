---
name: Consignado Audit Sentinel (Asset Protection)
description: Protocol for tracking inventory sent to resellers, automating audits, and recovering unreturned items.
---

# Consignado Audit Sentinel Protocol ðŸ›¡ï¸

**Objective:** "Protect the Asset."

## 1. The Audit Cycle ðŸ“…
*   **Frequency:** Every 30 days.
*   **Process:**
    1.  Agent sends WhatsApp: "Hora da Auditoria! Mande foto das peÃ§as que estÃ£o com vocÃª."
    2.  Reseller sends photo of the "Maleta".
    3.  **Vision Analysis:** Agent counts items in the photo.
        *   *Expected:* 50 items.
        *   *Counted:* 48 items.
    4.  **Result:** "Faltam 2 peÃ§as. VocÃª vendeu ou perdeu?"

## 2. The Contract Enforcer ðŸ“œ
*   **Trigger:** Reseller refuses to return kit or pay.
*   **Action:**
    1.  Retrieve "Assinatura Digital" (Selfie + Contrato) from `fl-assinatura-digital`.
    2.  Generate "NotificaÃ§Ã£o Extrajudicial" (PDF) using `deep_doc_researcher`.
    3.  Send to Reseller: "Evite problemas, devolva a maleta atÃ© amanhÃ£."

## 3. The "Acerto" Calculator ðŸ§®
*   **Calculation:**
    *   (Items Sent) - (Item Returned) = (Items Sold).
    *   (Items Sold * Price) - (Commission) = **Amount Due**.
*   **Payment:** Generate Pix Link via OpenPix/Asaas and send to Reseller.