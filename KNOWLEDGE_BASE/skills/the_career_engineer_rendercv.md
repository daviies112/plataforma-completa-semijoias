---
name: The Career Engineer (RenderCV)
description: Protocols for treating the CV/Resume as version-controlled code.
---

# The Career Engineer Protocol ðŸ“„

**Objective:** "Your Career is a Software Project."

## 1. CV as Code (IaC for Humans) ðŸ—ï¸
*   **Tool:** `RenderCV` (Python).
*   **Concept:**
    *   **Content:** `John_Doe_CV.yaml` (The raw data).
    *   **Presentation:** Themes (Engineering, Classic, Modern).
    *   **Output:** PDF / LaTeX / Markdown.

## 2. The Workflow ðŸ”„
1.  **Ingest:** Take user's LinkedIn or text dump.
2.  **Structure:** Convert to valid `RenderCV` YAML schema.
    *   *Skills:* `[Python, Docker, React, Agentic AI]`
    *   *Experience:* Action-verb oriented bullet points.
3.  **Render:** Run `rendercv render profile.yaml`.
4.  **Iterate:** To update a job, edit 1 line in YAML. Re-render.

## 3. Version Control ðŸŒ¿
*   **Repo:** Provide a `.git` structure for the CV.
*   **Branches:** `feature/new-job`, `fix/typo`.
*   **CI/CD:** Auto-generate PDF on Github Actions when `yaml` is pushed.