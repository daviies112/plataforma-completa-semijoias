---
## 3. OpenAPI Spec: A DocumentaÃ§Ã£o que Se Torna CÃ³digo ðŸ“„

```yaml
# openapi.yaml â€” documento central que gera tudo
openapi: 3.1.0
info:
  title: Antigravity API
  version: "1.0"
  description: |
    API REST para integraÃ§Ã£o com o sistema Antigravity.
    
    ## AutenticaÃ§Ã£o
    Todas as rotas requerem Bearer token no header Authorization.
    
    ## Rate Limits
    - Free tier: 100 requests/hora
    - Pro tier: 10.000 requests/hora
    
    ## Versionamento
    VersÃ£o atual: v1. VersÃµes antigas suportadas por 12 meses apÃ³s deprecaÃ§Ã£o.
  contact:
    email: api@seusite.com
  
servers:
  - url: https://api.seusite.com/v1
    description: ProduÃ§Ã£o
  - url: http://localhost:3000/v1
    description: Desenvolvimento

security:
  - bearerAuth: []

paths:
  /users/{userId}:
    get:
      summary: Buscar usuÃ¡rio por ID
      description: Retorna dados completos de um usuÃ¡rio especÃ­fico.
      tags: [Users]
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
      responses:
        "200":
          description: UsuÃ¡rio encontrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              example:
                data:
                  id: "123e4567-e89b-12d3-a456-426614174000"
                  name: "JoÃ£o Silva"
                  email: "joao@example.com"
                  created_at: "2026-01-15T10:30:00Z"
        "404":
          $ref: '#/components/responses/NotFound'
        "401":
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    User:
      type: object
      required: [id, name, email, created_at]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          minLength: 1
          maxLength: 100
        email:
          type: string
          format: email
        created_at:
          type: string
          format: date-time
  
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

```bash
# DO OpenAPI spec, gerar automaticamente:

# DocumentaÃ§Ã£o interativa (Scalar â€” mais moderna que Swagger UI)
npx @scalar/api-reference --input openapi.yaml --port 9000

# SDK Python
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./sdks/python \
  --additional-properties=packageName=antigravity_sdk

# SDK TypeScript
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./sdks/typescript

# Testes automatizados (Schemathesis â€” fuzzing contra a spec)
schemathesis run openapi.yaml --url http://localhost:3000
```
---

## 4. Rate Limiting: Proteger sem Frustrar ðŸ›¡ï¸

```python
# ImplementaÃ§Ã£o com Redis (FastAPI + slowapi)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Rate limits por tier (lidos do JWT do usuÃ¡rio)
def get_user_limit(request: Request) -> str:
    tier = request.state.user.tier  # "free" | "pro" | "enterprise"
    limits = {
        "free": "100/hour",
        "pro": "10000/hour", 
        "enterprise": "1000000/hour"
    }
    return limits.get(tier, "100/hour")

@app.get("/api/v1/data")
@limiter.limit(get_user_limit)
async def get_data(request: Request):
    return {"data": "..."}

# Headers de resposta (OBRIGATÃ“RIOS para boa DX):
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 87
# X-RateLimit-Reset: 1708966800  (Unix timestamp do reset)

# Quando rate limit Ã© atingido (429):
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 47 seconds.",
    "retry_after": 47
  }
}
```