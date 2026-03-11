---
name: Autonomous Ops (Self-Healing Infrastructure)
description: Protocols for a server that monitors and fixes itself using daily health checks and log analysis.
---

# Autonomous Ops Protocol ðŸ”§

**Objective:** maintain 99.9% uptime and data integrity without human intervention.

## 1. The Daily Health Check Routine ðŸ¥
Run these checks automatically (or before any major task):

### Database Integrity
*   **Connection Test:** Can we reach `postgresql://...`?
*   **Schema Validation:** Do critical tables (`n8n_chat_histories`) exist?
    *   *Auto-Fix:* If missing, run `CREATE TABLE IF NOT EXISTS` immediately.
*   **Data Stagnation:** when was the last row inserted? If >24h, alert generic "System Idle" or investigation.

### Application Health
*   **Docker Containers:** Are `n8n` and `supabase` containers `UP`?
    *   *Auto-Fix:* `docker restart <container_id>`
*   **Disk Space:** Is usage > 90%?
    *   *Auto-Fix:* Run `docker system prune -f`.

## 2. The Log Sentinel ðŸ•µï¸â€â™‚ï¸
*   **Pattern Matching:** Scan PM2/Docker logs for keywords: `ECONNREFUSED`, `Fatal Error`, `Heap out of memory`.
*   **Reactive Scripting:** Mapped complex errors to specific resolution scripts.
    *   *Scenario:* "Heap out of memory" -> *Action:* Increase Node.js memory limit in `docker-compose.yml`.

## 3. Database Unification Protocol
*   **Rule:** There shall be only ONE Source of Truth.
*   **Enforcement:** Periodically check for rogue databases (like `plataforma` vs `postgres`). If data is found in the wrong one, propose a migration script immediately.