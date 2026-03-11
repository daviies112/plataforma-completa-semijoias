---
## 4. Alertas Inteligentes (sem alert fatigue)

```yaml
# alertmanager.yml â€” REGRAS DE ALERTA
groups:
  - name: "Antigravity Critical"
    rules:
      # CRÃTICO: responder em < 5 minutos
      - alert: APIDown
        expr: up{job="antigravity-api"} == 0
        for: 1m
        annotations:
          summary: "API estÃ¡ down!"
          runbook: "https://docs.antigravity.app/runbooks/api-down"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "Error rate > 5% nos Ãºltimos 5 minutos"
          
      # AVISO: responder em < 1 hora
      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        annotations:
          severity: warning
          summary: "P99 de latÃªncia > 1 segundo"
          
      - alert: LLMCostSpike
        expr: increase(antigravity_llm_cost_usd_total[1h]) > 10
        annotations:
          summary: "Custo de LLM aumentou mais de $10 na Ãºltima hora"
          
      - alert: ErrorBudgetBurning
        expr: |
          (sum(rate(http_requests_total{status=~"5.."}[1h])) / sum(rate(http_requests_total[1h]))) 
          > (1 - 0.999) * 14.4
        for: 5m
        annotations:
          summary: "Queimando error budget 14x mais rÃ¡pido que o normal!"
```
---

## Trigger desta Skill

- "Meu sistema estÃ¡ lento mas nÃ£o sei onde"
- Antes de lanÃ§ar qualquer sistema em produÃ§Ã£o
- "Como configuro alertas para quando o sistema cair?"
- Ao escalar de MVP para produto com clientes pagantes
- Incidente em produÃ§Ã£o: usar traces para diagnÃ³stico rÃ¡pido