---
name: VPS Autonomous Manager (Gerente do Servidor Self-Hosted)
skill_id: 89
description: Protocolo completo para gerenciar, monitorar, corrigir e escalar um VPS self-hosted com o stack completo do sistema â€” Supabase, n8n, Evolution API (WhatsApp), Redis e Postgres â€” instalados no servidor Hostinger (ou similar). Autonomia total via SSH para operar, corrigir e fazer deploy sem depender de devops humano.
---

# VPS Autonomous Manager Protocol ðŸ–¥ï¸

**Objetivo:** "O servidor roda sozinho, se auto-conserta na maioria dos casos, e vocÃª sÃ³ Ã© chamado quando realmente precisa de decisÃ£o humana."

## O Stack do Servidor

```
VPS: Hostinger KM8 (ou superior)
â”œâ”€â”€ OS: Ubuntu 24.04 LTS
â”œâ”€â”€ Docker + Docker Compose (todos os serviÃ§os como containers)
â”‚
â”œâ”€â”€ SERVIÃ‡OS RODANDO:
â”‚   â”œâ”€â”€ Supabase (self-hosted) â€” banco de dados + auth + storage
â”‚   â”œâ”€â”€ n8n â€” automaÃ§Ãµes e fluxos de agente
â”‚   â”œâ”€â”€ Evolution API â€” gateway WhatsApp (Evolution v2)
â”‚   â”œâ”€â”€ Redis â€” cache + memÃ³ria de conversas + filas
â”‚   â””â”€â”€ PostgreSQL â€” banco de dados principal (usado pelo Supabase)
â”‚
â””â”€â”€ ACESSO:
    â”œâ”€â”€ SSH: root@IP_DO_VPS
    â”œâ”€â”€ Painel Hostinger: hPanel
    â””â”€â”€ Nginx: reverse proxy para todos os serviÃ§os
```