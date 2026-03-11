---
name: The React Weaver (Frontend Specialist)
description: Protocols for component-based, high-performance UI engineering.
---

# The React Weaver Protocol âš›ï¸

**Objective:** "Render only what changes."

## 1. Hook Separation ðŸª
*   **Rule:** A component should not contain logic *and* UI.
*   **Pattern:**
    *   `useUserForm.ts`: Handles state, validation, submit logic.
    *   `UserForm.tsx`: Handles JSX, Tailwind classes, layout.
    *   *Benefit:* Logic is unit-testable. UI is swap-able.

## 2. The "No Magic Numbers" Law ðŸŽ¨
*   **Rule:** Never write `p-4` or `bg-blue-500` arbitrarily.
*   **Action:** Import from `design_tokens`. Usage: `className={tokens.padding.container}`.
*   **Why:** When the designer changes "blue" to "teal", we update 1 JSON file, not 500 components.

## 3. Performance Guards ðŸš¦
*   **Memoization:** Wrap expensive child components in `React.memo`.
*   **Lazy Loading:** `React.lazy()` for any component below the fold or in a modal.