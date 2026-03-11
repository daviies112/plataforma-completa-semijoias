---
## 1. O Design First Approach (OpenAPI 3.1)

```yaml
# api-spec.yaml â€” ESCREVER O SPEC ANTES DE CODAR
openapi: "3.1.0"
info:
  title: Antigravity API
  version: "2.1.0"
  description: |
    API para automaÃ§Ã£o inteligente de processos empresariais.
    
    **AutenticaÃ§Ã£o:** Bearer token via Authorization header.
    **Rate Limits:** 1000 req/min no plano Pro, 100 req/min no Free.
    **Versionamento:** URL-based (/v1, /v2). v1 deprecated em 2027-01-01.

servers:
  - url: https://api.antigravity.app/v2
    description: ProduÃ§Ã£o
  - url: https://api.staging.antigravity.app/v2
    description: Staging

paths:
  /workflows:
    get:
      summary: Listar workflows do usuÃ¡rio
      description: Retorna todos os workflows ativos e inativos do usuÃ¡rio autenticado.
      operationId: listWorkflows
      tags: [Workflows]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive, all]
          description: Filtrar por status
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: Lista de workflows
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowList'
              example:
                data:
                  - id: "wf_abc123"
                    name: "Instagram Monitor"
                    status: "active"
                    last_run: "2026-02-18T10:30:00Z"
                meta:
                  total: 47
                  page: 1
                  limit: 20
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'
```
---

## 2. Versionamento e Compatibilidade

```python
# VERSIONAMENTO URL-BASED (mais claro para APIs pÃºblicas)
# /v1/workflows (versÃ£o atual estÃ¡vel)
# /v2/workflows (nova versÃ£o, potencialmente breaking)

# FastAPI com versionamento:
from fastapi import FastAPI
from fastapi.routing import APIRouter

app = FastAPI()

# VersÃ£o 1 (manter por 12+ meses apÃ³s deprecaÃ§Ã£o)
v1_router = APIRouter(prefix="/v1")

@v1_router.get("/workflows")
async def list_workflows_v1():
    # Headers de deprecaÃ§Ã£o:
    return Response(
        content=...,
        headers={
            "Deprecation": "true",
            "Sunset": "Sat, 01 Jan 2027 00:00:00 GMT",
            "Link": '</v2/workflows>; rel="successor-version"'
        }
    )

# VersÃ£o 2 (atual, com breaking changes documentadas)
v2_router = APIRouter(prefix="/v2")

@v2_router.get("/workflows")
async def list_workflows_v2():
    # Nova interface
    ...

app.include_router(v1_router)
app.include_router(v2_router)
```