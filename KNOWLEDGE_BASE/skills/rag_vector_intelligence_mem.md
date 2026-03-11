---
name: RAG & Vector Intelligence (MemÃ³ria Real com Busca SemÃ¢ntica)
skill_id: 70
description: O sistema completo de Retrieval-Augmented Generation â€” chunking inteligente, embeddings, hybrid search, reranking, e arquiteturas avanÃ§adas como HyDE e Multi-Query. A diferenÃ§a entre um agente que "comprime logs em JSON" e um que genuinamente recupera contexto relevante de qualquer base de conhecimento.
---

# RAG & Vector Intelligence Protocol ðŸ§ 

**Objetivo:** "O agente encontra exatamente o que precisa, mesmo em bases de milhares de documentos."

## Por que o Episodic Memory Compressor NÃ£o Ã‰ RAG Real

O Episodic Memory Compressor comprime logs de conversa em summaries e salva em JSON. Ãštil, mas fundamentalmente diferente de RAG real. RAG real significa:

1. **Documentos** sÃ£o fragmentados (chunking) em pedaÃ§os com overlap
2. Cada pedaÃ§o Ã© convertido em um **embedding** (vetor numÃ©rico que captura semÃ¢ntica)
3. Na hora da query, a pergunta tambÃ©m vira embedding
4. O sistema busca os pedaÃ§os **mais similares semanticamente** (nÃ£o por keyword)
5. Os pedaÃ§os recuperados sÃ£o passados como **contexto** para o LLM responder

Isso permite que o agente "lembre" de qualquer documento que vocÃª ingestionou â€” contratos, PDFs, bases de conhecimento, emails, cÃ³digo â€” sem precisar caber no contexto.