---
## 5. Alertas Inteligentes (Sem Alert Fatigue) ðŸ””

```yaml
# prometheus_alerts.yml â€” Alertas que importam
groups:
  - name: critical_alerts
    rules:
      # Alerta CRÃTICO: serviÃ§o down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.job }} estÃ¡ DOWN"
          runbook: "https://notion.so/runbook/service-down"
          # AÃ§Ã£o: acordar alguÃ©m Ã s 3am se necessÃ¡rio
      
      # Alerta ALTO: error rate elevada
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "Error rate > 1% nos Ãºltimos 5 minutos"
      
      # Alerta MÃ‰DIO: latÃªncia degradada
      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: medium
        annotations:
          summary: "P99 latÃªncia > 2s"

# alertmanager.yml â€” Roteamento de alertas
route:
  receiver: slack_critical
  routes:
    - match:
        severity: critical
      receiver: pagerduty        # acorda alguÃ©m
    - match:
        severity: high
      receiver: slack_urgent     # mensagem urgente
    - match:
        severity: medium
      receiver: slack_general    # canal de monitoramento
```
---

## Trigger desta Skill

- Ao colocar qualquer sistema em produÃ§Ã£o
- "Por que a aplicaÃ§Ã£o ficou lenta?"
- "Como sei quando algo quebrou antes do cliente reclamar?"
- "Quero criar SLAs para meu produto"
- Incident response: diagnosticar o que aconteceu
- RevisÃ£o trimestral de observabilidade e alertas