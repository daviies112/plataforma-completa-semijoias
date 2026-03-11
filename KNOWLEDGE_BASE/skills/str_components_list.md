---
## 3. Templates: Mensagens Fora da Janela de 24h ðŸ“‹

```
REGRA CRUCIAL DO META:
â†’ Dentro de 24h apÃ³s mensagem do usuÃ¡rio: pode enviar qualquer texto
â†’ Depois de 24h: APENAS templates prÃ©-aprovados pelo Meta

TIPOS DE TEMPLATES APROVADOS:
âœ“ Utilidade: confirmaÃ§Ã£o de pedido, status, notificaÃ§Ã£o
âœ“ AutenticaÃ§Ã£o: OTP, cÃ³digo de verificaÃ§Ã£o
âœ“ Marketing: promoÃ§Ãµes (precisa opt-in explÃ­cito do usuÃ¡rio)

EXEMPLOS DE TEMPLATES QUE FUNCIONAM:
```

```
Template "order_confirmation":
OlÃ¡ {{1}}, seu pedido #{{2}} foi confirmado! ðŸŽ‰
PrevisÃ£o de entrega: {{3}}
Acompanhe em: {{4}}

Template "payment_received":
Pagamento de R$ {{1}} recebido com sucesso!
Ref: {{2}}
Obrigado por comprar com a gente!

Template "lead_followup":
Oi {{1}}! Vi que vocÃª se interessou pelo {{2}}.
Posso tirar alguma dÃºvida? ðŸ˜Š
```

```python
# Enviar template aprovado:
async def send_template(to: str, template_name: str, components: list):
    await requests.post(
        f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages",
        json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "pt_BR"},
                "components": components
            }
        }
    )
```
---

## 4. O Chatbot de Vendas Completo ðŸ¤–

```
FLUXO DO CHATBOT (implementado em n8n):

[UsuÃ¡rio manda mensagem]
        â†“
[Verificar se tem lead existente no CRM]
  SE NÃƒO: Criar lead, pedir nome
  SE SIM: Carregar contexto da conversa anterior
        â†“
[Classificar intenÃ§Ã£o com IA]
  - Pergunta sobre produto â†’ RAG na base de conhecimento
  - Pedido de preÃ§o â†’ tabela de preÃ§os
  - ReclamaÃ§Ã£o â†’ roteamento para humano
  - Interesse em compra â†’ iniciar qualificaÃ§Ã£o
        â†“
[Gerar resposta com Claude]
  System prompt: persona do assistente + contexto da empresa
  MemÃ³ria: Ãºltimas N mensagens da conversa
  RAG: contexto relevante da base de conhecimento
        â†“
[Enviar resposta]
        â†“
[Atualizar CRM + log de conversa no Supabase]
```