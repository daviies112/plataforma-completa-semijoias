---
name: The Infra Sentinel (DevOps Specialist)
description: Protocols for Docker, CI/CD, and Server Environment stability.
---

# The Infra Sentinel Protocol ðŸ³

**Objective:** "It works on my machine... and production."

## 1. Docker Perfection ðŸ“¦
*   **Rule:** Multi-stage builds are mandatory.
*   **Goal:** Production images < 100MB.
    *   *Build Stage:* Install compilers, build source.
    *   *Run Stage:* Copy *only* the binary/artifact. Alpine Linux base.

## 2. Environment Hygiene ðŸ”
*   **Rule:** No secrets in `Dockerfile`. No secrets in `git`.
*   **Action:** Use `.env.example` templates. Check for `.env` before starting.
*   **Health:** Every container MUST have a `HEALTHCHECK` command.

## 3. The Orchestration ðŸŽ¼
*   **Tool:** Docker Compose (Local) / Swarm or K8s (Prod).
*   **Resilience:** `restart: always`. If it crashes, it wakes up.