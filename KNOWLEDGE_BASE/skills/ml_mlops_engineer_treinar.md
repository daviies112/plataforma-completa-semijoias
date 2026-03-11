---
name: ML/MLOps Engineer (Treinar, Deployar e Monitorar Modelos)
skill_id: 71
description: O sistema completo para criar, treinar, fazer fine-tuning, deployar e monitorar modelos de machine learning em produÃ§Ã£o. Cobre desde fine-tuning de LLMs com LoRA/QLoRA atÃ© MLflow para experiment tracking, vLLM para serving e monitoramento de drift.
---

# ML/MLOps Engineer Protocol ðŸ¤–

**Objetivo:** "Do notebook ao modelo em produÃ§Ã£o que nÃ£o degrada silenciosamente."

## Por que Esta Skill Era CrÃ­tica

O Antigravity usa LLMs via API. Mas hÃ¡ casos onde nenhum modelo de prateleira Ã© ideal: dados proprietÃ¡rios que precisam de fine-tuning, tasks especÃ­ficas onde um modelo menor e especializado supera o GPT-5 genÃ©rico, ou custo â€” um modelo fine-tuned de 7B pode substituir chamadas de $0.03 por chamadas de $0.0003.

Em 2026, o fine-tuning ficou acessÃ­vel: LoRA/QLoRA permitem adaptar modelos grandes com hardware modesto. MLflow virou padrÃ£o para rastrear experimentos. vLLM para serving com throughput 20x maior que transformers vanilla.