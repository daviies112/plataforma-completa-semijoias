---
name: WhatsApp Number Lifecycle Manager (GestÃ£o de NÃºmeros em Escala)
skill_id: 88
description: Protocolo completo para gerenciar mÃºltiplos nÃºmeros de WhatsApp com diferentes propÃ³sitos â€” API oficial (nÃºmero principal), nÃºmeros de suporte e vendas, e nÃºmeros descartÃ¡veis para raspagem e testes. Inclui estratÃ©gias anti-banimento, aquecimento de nÃºmeros e substituiÃ§Ã£o automÃ¡tica quando necessÃ¡rio.
---

# WhatsApp Number Lifecycle Manager Protocol ðŸ“±

**Objetivo:** "Nunca perder comunicaÃ§Ã£o com nenhuma revendedora por problema de nÃºmero â€” e nunca usar o nÃºmero principal para operaÃ§Ãµes de risco."

## A Arquitetura de NÃºmeros em 3 Camadas

```
CAMADA 1 â€” NÃšMEROS PERMANENTES (proteger a todo custo)
â”œâ”€â”€ NÃºmero API Oficial (WhatsApp Business API via Meta)
â”‚   â†’ Usado para: comunicaÃ§Ã£o com todas as revendedoras
â”‚   â†’ Custo: por mensagem (templates de marketing)
â”‚   â†’ Verificado pelo Meta, muito difÃ­cil de banir
â”‚   â†’ SE BANIR: perda crÃ­tica de negÃ³cio â€” proteger obsessivamente
â”‚
â””â”€â”€ NÃºmero Suporte/Vendas (WhatsApp Business App)
    â†’ Usado para: casos complexos, humano assume conversa
    â†’ Backup se API der problema
    â†’ NÃºmero da empresa, nÃ£o pessoal

CAMADA 2 â€” NÃšMEROS OPERACIONAIS (gerenciar cuidadosamente)
â”œâ”€â”€ NÃºmeros por Nicho (um por plataforma)
â”‚   â†’ Semijoias: +55 (11) XXXXX-XXXX
â”‚   â†’ CosmÃ©ticos: +55 (11) YYYYY-YYYY
â”‚   â†’ Cada nicho com seu nÃºmero = separaÃ§Ã£o de contexto
â”‚
â””â”€â”€ NÃºmeros de Agentes EspecÃ­ficos
    â†’ Agente de onboarding
    â†’ Agente de suporte tÃ©cnico
    â†’ Agente de vendas/conversÃ£o

CAMADA 3 â€” NÃšMEROS DESCARTÃVEIS (alta rotatividade esperada)
â”œâ”€â”€ NÃºmeros para Abordagem de Leads Frios
â”‚   â†’ Primeira abordagem de leads raspados
â”‚   â†’ Alta taxa de bloqueio esperada (normal)
â”‚   â†’ Rodar por 30-60 dias, trocar preventivamente
â”‚
â””â”€â”€ NÃºmeros para Testes e Desenvolvimento
    â†’ Testar novos fluxos antes do produÃ§Ã£o
    â†’ Jamais usar produÃ§Ã£o para testes
```