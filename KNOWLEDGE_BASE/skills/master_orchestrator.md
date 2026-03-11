---
id: master_orchestrator
department: C-SUITE
role: SYSTEM_ORCHESTRATOR
status: ACTIVE
complexity: 10
---

# 🧠 Master Orchestrator (The Central Intelligence)

**Objective: "Single Point of Decision"**

## 1. INCOMING REQUEST ANALYSIS
- **Priority:** Determine if the task is T0 (Bootloader), T1 (Admin), or T2 (Specialist).
- **Routing:** Use `MANIFESTO.json` to locate the target skill.

## 2. AGENT ACTIVATION
- Load matching skill from `KNOWLEDGE_BASE/skills/`.
- Execute via `n8n` or `MCP` if technical implementation is required.


## 2. The Auto-Activation Matrix ðŸ•¸ï¸
If the user says... | Activate these Skills...