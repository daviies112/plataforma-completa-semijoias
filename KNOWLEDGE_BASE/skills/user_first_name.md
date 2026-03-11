---
## 3. SequÃªncias de Email com IA (Nurturing Personalizado) ðŸ¤–

```javascript
// n8n Workflow: SequÃªncia de Onboarding com IA
// Trigger: novo usuÃ¡rio se cadastra no Supabase

// ESTRUTURA DA SEQUÃŠNCIA (7-email onboarding):
const onboarding_sequence = [
  { day: 0,  subject: "Bem-vindo(a), {first_name}! Por onde comeÃ§ar",    type: "welcome" },
  { day: 1,  subject: "O seu primeiro {produto_feature} em 5 minutos",   type: "activation" },
  { day: 3,  subject: "Como {empresa_similar} fez X com {produto}",      type: "social_proof" },
  { day: 7,  subject: "VocÃª usou {feature_mais_usada}?",                 type: "engagement" },
  { day: 14, subject: "Resultado: usuÃ¡rios que fazem X tÃªm Y% mais ROI", type: "value_proof" },
  { day: 21, subject: "Uma pergunta direta, {first_name}",               type: "reply_request" },
  { day: 30, subject: "Seu relatÃ³rio de 30 dias",                        type: "milestone" }
];

// PERSONALIZAÃ‡ÃƒO COM CLAUDE (n8n Code Node):
async function personalizeEmail(user, template_type) {
  const userContext = {
    name: user.first_name,
    plan: user.subscription_plan,
    features_used: user.features_used,  // do Supabase
    industry: user.company_industry,
    company_size: user.company_size
  };
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Escreva um email de ${template_type} para este usuÃ¡rio:
        ${JSON.stringify(userContext)}
        
        Regras:
        - Tom: profissional mas caloroso
        - MÃ¡ximo 150 palavras no corpo
        - Um Ãºnico CTA claro
        - Personalizar com o contexto da indÃºstria
        - NÃ£o mencionar planos ou preÃ§os
        
        Retornar JSON: { subject, preview_text, body_html, cta_text, cta_url }`
      }]
    })
  });
  
  return JSON.parse(response.content[0].text);
}

// ENVIO VIA RESEND:
async function sendEmail(to, email_content) {
  const resend = new Resend(process.env.RESEND_KEY);
  return await resend.emails.send({
    from: 'equipe@seudominio.com',
    to: to,
    subject: email_content.subject,
    html: email_content.body_html,
    headers: {
      'X-Entity-Ref-ID': generateUnsubscribeToken(to)  // para opt-out
    }
  });
}
```
---

## 4. SegmentaÃ§Ã£o AvanÃ§ada e Broadcasts ðŸŽ¯

```sql
-- SEGMENTOS NO SUPABASE (base para todos os broadcasts)

-- UsuÃ¡rios de alto valor sem engajamento recente (risco de churn)
CREATE VIEW segment_at_risk AS
SELECT 
  u.id, u.email, u.first_name,
  MAX(e.created_at) as last_event,
  COUNT(DISTINCT e.event_name) as unique_events_30d,
  u.subscription_plan,
  u.mrr
FROM users u
LEFT JOIN analytics_events e ON e.user_id = u.id 
  AND e.created_at > NOW() - INTERVAL '30 days'
WHERE u.subscription_plan != 'free'
  AND u.mrr > 50  -- usuÃ¡rios pagantes
GROUP BY u.id, u.email, u.first_name, u.subscription_plan, u.mrr
HAVING MAX(e.created_at) < NOW() - INTERVAL '14 days'  -- sem atividade hÃ¡ 14 dias
  OR COUNT(DISTINCT e.event_name) < 3;  -- baixo engajamento

-- Feature nÃ£o adotada (cross-sell/upsell)
CREATE VIEW segment_feature_gap AS
SELECT u.id, u.email, u.first_name, 
       'feature_x' as missing_feature
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM feature_usage fu 
  WHERE fu.user_id = u.id AND fu.feature = 'feature_x'
)
AND u.subscription_plan = 'pro';  -- tem o plano mas nÃ£o usa

-- Script n8n para broadcast segmentado:
-- 1. Query Supabase para segment_at_risk
-- 2. Para cada usuÃ¡rio: Claude gera email personalizado (win-back angle)
-- 3. Resend envia com tag 'win-back' para tracking
-- 4. Supabase log: email_sent com timestamp e segment
```