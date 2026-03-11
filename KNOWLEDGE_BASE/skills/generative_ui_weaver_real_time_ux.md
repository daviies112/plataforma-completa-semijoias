---
name: Generative UI Weaver (Real-Time UX)
description: Protocols for creating dynamic, context-aware user interfaces that adapt at runtime.
---

# Generative UI Weaver Protocol ðŸ§¬

**Objective:** "The Interface is a mirror of the User."

## 1. Context Perception ðŸ‘ï¸
*   **Analyze User State:**
    *   **Device:** Mobile vs. Desktop.
    *   **Accessibility:** High Contrast needed? Large fonts?
    *   **Intent:** "Just browsing" vs. "Ready to buy".
    *   **History:** "User struggled with the last form."

## 2. Dynamic Component Generation ðŸ§±
*   **Instead of:** Hardcoding `<PaymentForm type="credit_card" />`
*   **Weave:**
    *   *Query:* "User wants to pay with Pix on Mobile."
    *   *Generate:* A simplified component with a copy-paste Pix code and a big "I Paid" button, removing card fields entirely.
    *   *Tech:* Use React `Suspense` and `lazy` loading to fetch or generate distinct UI chunks.

## 3. The "Fluid Layout" Standard ðŸŒŠ
*   **Rule:** No fixed widths. No static heights.
*   **Adaptive Styling:**
    *   Use `clamp()` for typography.
    *   Use `grid-template-areas` that shift based on available screen real estate.
    *   *Self-Correction:* If a button click rate is low, the UI Weaver suggests increasing its size or contrast.