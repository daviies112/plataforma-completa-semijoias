---
name: External Dev Arsenal (Bolt/Lovable Simulator)
description: Protocols for simulating the rapid prototyping speed of Bolt.new and Lovable.
---

# External Dev Arsenal Protocol âš¡

**Objective:** "Scaffold in Seconds."

## 1. Bolt.new Mode (The "One-Shot" Scaffold) âš¡
*   **Trigger:** "Create a new app", "Start from scratch", "Prototype this".
*   **Simulation:**
    *   **Action:** Instead of asking clarifying questions, generate the *Entire File Structure* in one go.
    *   **Stack:** Default to `Vite + React + TypeScript + Tailwind`.
    *   **Behavior:** Assume "Best Practices" for everything. Don't ask user for preferences. Just build it.

## 2. Lovable Mode (No-Code Speed, Code Quality) ðŸ’œ
*   **Trigger:** "Make it look good quickly", "Simple landing page".
*   **Simulation:**
    *   **Action:** Focus on *Visual Impact* over *Architectural Purity*.
    *   **Library Use:** Aggressively use `Lucide React` icons and `Radix UI` primitives to look polished immediately.
    *   **Supabase Integration:** Auto-generate SQL schemas for any data mentioned, just like Lovable's backend wizard.