# Relatório Exaustivo de Erros - Plataforma
Data: 2026-03-07 (UTC)
Escopo: frontend + backend + runtime (PM2)

## 1) Metodologia executada
- Build de produção: `npm run build`
- Typecheck frontend: `npx tsc --noEmit -p tsconfig.app.json`
- Typecheck backend: `npx tsc --noEmit -p tsconfig.server.json`
- Lint amplo: `npx eslint src server --ext .ts,.tsx`
- Diagnóstico runtime: `pm2 list`, `pm2 logs plataforma --err --lines 400 --nostream`

## 2) Resultado geral (resumo executivo)
- Build: OK (compila), mas com warning de API Sentry inválida.
- TypeScript app: 568 erros.
- TypeScript server: 266 erros.
- ESLint: 2.763 problemas (2.629 erros, 134 warnings).
- Runtime PM2: erros recorrentes de integração, tabelas ausentes e falhas de fetch em jobs multi-tenant.

## 3) Achados críticos (P0)

### P0.1 - Integrações quebradas por tabelas inexistentes no banco
Evidência (PM2): `relation "google_calendar_config" does not exist`, `relation "n8n_config" does not exist`, `relation "pluggy_config" does not exist`, `relation "whatsapp_labels" does not exist`.
Frequência observada no log:
- `google_calendar_config`: 7
- `n8n_config`: 7
- `pluggy_config`: 7
- `whatsapp_labels`: 6
Impacto:
- Conexões aparecem como erro/parcial.
- Recursos de calendário, n8n, pluggy e labels falham/ficam vazios no frontend.
Como resolver:
- Aplicar migrations para criação dessas tabelas em produção.
- Garantir bootstrap idempotente (create table if not exists) para ambientes novos.
- Validar startup check bloqueando recursos dependentes quando schema estiver incompleto.

### P0.2 - Jobs multi-tenant com falha recorrente de rede/dados
Evidência (PM2): `TypeError: fetch failed` (204 ocorrências).
Arquivos de origem no stack trace compilado: módulos de detecção/sincronização (`getClientDashboardData`, `pollFormSubmissions`, `executeClientAutomation`).
Impacto:
- Dados não atualizam no dashboard.
- Pollers ficam falhando e conexões parecem instáveis/indisponíveis.
Como resolver:
- Adicionar retry exponencial com circuit breaker e timeout controlado via `AbortController`.
- Logar URL/alvo sanitizado para identificar endpoint que falha.
- Isolar falha por tenant sem contaminar ciclo completo do poller.

### P0.3 - API pública de loja com variáveis não definidas
Arquivo: `/var/www/plataformacompleta/server/routes/publicStore.ts:248`
Problema:
- Uso de `supabaseUrl`, `supabaseServiceKey`, `supabaseKey` sem declaração no escopo (`TS2304`).
Impacto:
- Falha ao montar client de fallback; telas da loja/revenda podem não carregar dados.
Como resolver:
- Declarar valores explicitamente no escopo da função (`process.env...`) ou reutilizar helper central de credenciais.
- Cobrir com teste de rota para caso “sem config local, com env”.

### P0.4 - Incompatibilidade com SDK do Sentry (API antiga)
Arquivos:
- `/var/www/plataformacompleta/server/lib/sentry.ts:176`
- `/var/www/plataformacompleta/server/lib/sentryOptimized.ts:78`
Problema:
- Uso de APIs removidas/alteradas (`startTransaction`, `Sentry.Integrations`, `Sentry.Handlers`, `getCurrentHub`).
Impacto:
- Telemetria instável ou silenciosamente quebrada; perda de observabilidade.
Como resolver:
- Migrar para API atual do `@sentry/node` v10 (setup oficial novo).
- Remover wrappers legados e consolidar em um único módulo Sentry.

### P0.5 - Session store inadequado em produção
Evidência (PM2): `MemoryStore is not designed for a production environment` (21 ocorrências).
Impacto:
- Risco de perda de sessão, vazamento de memória e inconsistência de autenticação.
Como resolver:
- Migrar `express-session` para store persistente (Redis recomendado).

## 4) Achados de alto impacto funcional (P1)

### P1.1 - Frontend com respostas `unknown` em massa (dados não renderizam corretamente)
Contagem: 323 erros `Property 'X' does not exist on type 'unknown'` no app.
Arquivos mais afetados:
- `/var/www/plataformacompleta/src/pages/SettingsPage.tsx` (135)
- `/var/www/plataformacompleta/src/platforms/mobile/pages/SettingsPage.tsx` (83)
- `/var/www/plataformacompleta/src/features/executive-dashboard/ExecutiveDashboard.tsx` (43)
Problema estrutural:
- `useQuery` sem tipagem de retorno + acesso direto a campos (`success`, `connections`, `data`, etc.).
Impacto:
- Se contrato da API variar, frontend quebra silenciosamente ou mostra vazio/desatualizado.
Como resolver:
- Criar interfaces de resposta por endpoint e tipar `useQuery<RespostaX>()`.
- Criar hooks tipados (`useConnections`, `useDashboardData`, etc.) em vez de acessar JSON cru em páginas.

### P1.2 - Cache global conflitando com atualização de dados no frontend
Arquivo: `/var/www/plataformacompleta/server/middleware/cloudflareCache.ts:31`
Problema:
- Regra `api` cacheia `/api/forms|products|workspace` com `max-age` e `stale-while-revalidate`, inclusive endpoints sensíveis a atualização imediata.
Impacto:
- UI pode exibir dados antigos após salvar/editar.
Como resolver:
- Excluir endpoints críticos de cache (`/api/forms`, `/api/workspace` mutáveis, etc.).
- Cachear apenas leitura pública e conteúdo imutável.

### P1.3 - Tipagem de params/query no backend (`string | string[]`) quebrando chamadas
Exemplos recorrentes: `server/routes/assinatura.ts`, `envio.ts`, `store.ts`, `formularios-complete.ts`.
Problema:
- Parâmetros não normalizados sendo passados para funções que exigem `string`.
Impacto:
- Erros de runtime e comportamento inconsistente em filtros/consultas.
Como resolver:
- Normalizar sempre: `const id = Array.isArray(v) ? v[0] : v;` + validação Zod.
- Criar utilitário único de normalização de params/query.

### P1.4 - Inconsistência de tipos de autenticação
Arquivo: `/var/www/plataformacompleta/server/routes/auth.ts:15`
Problema:
- `AuthenticatedRequest` incompatível com tipo global de `req.user` (campos divergentes como `clientId`, `role`).
Impacto:
- Handlers com overload quebrado e risco de autorização incorreta por suposição de shape.
Como resolver:
- Unificar tipo de `req.user` em definição global e reaproveitar em todas as rotas.

### P1.5 - Imports ausentes / módulos inexistentes
Frontend exemplos:
- `@/types/database`, `@/types/gamification`, `@/types/achievements`, `@/types/client`
- `@/components/Board`, `@/components/CardDetailModal`, `@/components/FilterSidebar`
Backend exemplos:
- `stripe`, `bwip-js`, `@simplewebauthn/server/script/deps`, `../storage.js`
Impacto:
- Recursos não compilam sob verificação estrita; alta chance de quebra em refactors/deploys alternativos.
Como resolver:
- Corrigir paths/imports órfãos e garantir dependências/tipos instalados.
- Adotar regra CI para bloquear merge com import não resolvido.

## 5) Achados médios (P2)

### P2.1 - Componente de calendário incompatível com versão atual da lib
Arquivo: `/var/www/plataformacompleta/src/components/ui/calendar.tsx`
Problema:
- API usada não corresponde aos exports/propriedades da versão instalada (`react-day-picker`).
Impacto:
- Erros de tipagem e risco de quebra visual/funcional no calendário.
Como resolver:
- Ajustar componente para API da versão atual ou fixar versão compatível.

### P2.2 - Contratos de dados divergentes em formulários/revenda/notion
Exemplos:
- Campos ausentes em tipos (`completionPageConfig`, `forms`, `stats`, `credentials`, etc.).
- Múltiplos `No overload matches this call` por incompatibilidade de assinatura.
Impacto:
- Dados não exibem corretamente em telas de dashboard/formulários/revenda.
Como resolver:
- Revisar contratos DTO frontend/backend e gerar tipos compartilhados.

### P2.3 - Qualidade geral de tipagem baixa (muito `any`)
ESLint: `@typescript-eslint/no-explicit-any` é a principal origem de erros.
Impacto:
- Aumenta regressões silenciosas e dificulta depuração de dados não atualizando.
Como resolver:
- Plano incremental: módulos críticos primeiro (dashboard, settings, formularios, integrações).

## 6) Arquivos com maior concentração de falhas (priorizar correção)
Frontend (TS):
- `/var/www/plataformacompleta/src/pages/SettingsPage.tsx`
- `/var/www/plataformacompleta/src/platforms/mobile/pages/SettingsPage.tsx`
- `/var/www/plataformacompleta/src/features/executive-dashboard/ExecutiveDashboard.tsx`
- `/var/www/plataformacompleta/src/components/ui/calendar.tsx`

Backend (TS):
- `/var/www/plataformacompleta/server/routes/formularios-complete.ts`
- `/var/www/plataformacompleta/server/routes/assinatura.ts`
- `/var/www/plataformacompleta/server/routes/envio.ts`
- `/var/www/plataformacompleta/server/routes/store.ts`
- `/var/www/plataformacompleta/server/routes/publicStore.ts`
- `/var/www/plataformacompleta/server/lib/sentry.ts`
- `/var/www/plataformacompleta/server/lib/sentryOptimized.ts`

## 7) Plano recomendado de correção (ordem de execução)
1. Banco/migrations em produção para tabelas faltantes (`google_calendar_config`, `n8n_config`, `pluggy_config`, `whatsapp_labels`).
2. Estabilizar sessão em produção (Redis store) e remover dependência de MemoryStore.
3. Corrigir `publicStore.ts` (variáveis fora de escopo) e módulos de integração com falha imediata.
4. Corrigir camada Sentry para SDK atual e validar captura de erro real.
5. Resolver cache indevido em endpoints mutáveis (`/api/forms` etc.) para eliminar dados stale no frontend.
6. Normalizar params/query (`string | string[]`) no backend inteiro com helper único + validação Zod.
7. Tipar respostas de API e hooks React Query (Settings, ExecutiveDashboard, ClientPage, Revenda).
8. Corrigir imports órfãos e dependências faltantes.
9. Ajustar componentes incompatíveis com versões de libs (ex.: calendar/day-picker).
10. Ativar gate de qualidade em CI: `tsc app+server`, `eslint`, smoke de rotas críticas.

## 8) Evidências e artefatos gerados
- `/tmp/tsc_app_errors.txt`
- `/tmp/tsc_server_errors.txt`
- `/tmp/eslint_errors.txt`
- PM2 analisado via `pm2 logs plataforma --err --lines 400 --nostream`

## 9) Nota de cobertura
Este relatório cobre análise estática completa + diagnóstico de runtime por logs PM2. Testes e2e de interface (cliques/fluxos visuais em browser real) não foram executados neste ciclo; portanto, o documento traz todos os erros detectáveis por compilação/lint/log e os riscos funcionais derivados deles.
