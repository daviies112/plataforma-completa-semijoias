import { Router, Request } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { pool } from '../db';

const settingsRouter = Router();

function resolveTenantId(req: AuthRequest | Request): string | null {
  const user = (req as AuthRequest).user;
  if (user?.tenantId) {
    return user.tenantId;
  }
  const session = (req.session as any) || {};
  return session.tenantId || session.tenant_id || null;
}

settingsRouter.post('/evolution', authenticateToken, async (req, res) => {
  if (!pool) {
    console.error('[SETTINGS] Pool de banco de dados não iniciado');
    return res.status(503).json({ success: false, error: 'Banco de dados indisponível' });
  }

  const tenantId = resolveTenantId(req);
  if (!tenantId) {
    return res.status(401).json({ success: false, error: 'Tenant não identificado' });
  }

  const body = req.body || {};
  const evolutionUrlRaw = body.evolutionUrl || body.evolution_url || body.url;
  const evolutionKeyRaw = body.evolutionKey || body.evolution_key || body.apiKey;
  const instanceRaw = body.instanceName || body.evolution_instance || body.instance;

  const evolutionUrl = typeof evolutionUrlRaw === 'string' ? evolutionUrlRaw.trim() : '';
  const evolutionKey = typeof evolutionKeyRaw === 'string' ? evolutionKeyRaw.trim() : '';
  const formattedInstance = typeof instanceRaw === 'string' ? instanceRaw.trim().toLowerCase() : '';
  const fallbackInstance = typeof tenantId === 'string' ? tenantId.trim().toLowerCase() : 'nexus-whatsapp';
  const evolutionInstance = formattedInstance || fallbackInstance;

  if (!evolutionUrl || !evolutionKey) {
    return res.status(400).json({
      success: false,
      error: 'Por favor, preencha a URL da API e a API Key do Evolution API'
    });
  }

  try {
    new URL(evolutionUrl);
  } catch (error) {
    return res.status(400).json({ success: false, error: 'URL da Evolution API inválida' });
  }

  try {
    await pool.query(
      `INSERT INTO app_settings (tenant_id, evolution_api_url, evolution_api_key, evolution_instance, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (tenant_id) DO
         UPDATE SET evolution_api_url = EXCLUDED.evolution_api_url,
                    evolution_api_key = EXCLUDED.evolution_api_key,
                    evolution_instance = EXCLUDED.evolution_instance,
                    updated_at = NOW()`,
      [tenantId, evolutionUrl, evolutionKey, evolutionInstance]
    );

    await pool.query(
      `INSERT INTO evolution_api_config (tenant_id, api_url, api_key, instance, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (tenant_id) DO
         UPDATE SET api_url = EXCLUDED.api_url,
                    api_key = EXCLUDED.api_key,
                    instance = EXCLUDED.instance,
                    updated_at = NOW()`,
      [tenantId, evolutionUrl, evolutionKey, evolutionInstance]
    );

    return res.json({ success: true, message: 'Configurações da Evolution API salvas com sucesso' });
  } catch (error) {
    console.error('[SETTINGS] Erro ao salvar Evolution API:', error);
    return res.status(500).json({ success: false, error: 'Erro interno ao salvar configurações' });
  }
});

settingsRouter.get('/evolution', authenticateToken, async (req, res) => {
  if (!pool) {
    console.error('[SETTINGS] Pool de banco de dados indisponível');
    return res.status(503).json({ success: false, error: 'Banco de dados indisponível' });
  }

  const tenantId = resolveTenantId(req);
  if (!tenantId) {
    return res.status(401).json({ success: false, error: 'Tenant não identificado' });
  }

  try {
    const result = await pool.query(
      'SELECT evolution_api_url, evolution_api_key, evolution_instance FROM app_settings WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    const row = result.rows[0] || {};
    return res.json({
      evolutionUrl: row.evolution_api_url || '',
      evolutionKey: row.evolution_api_key || '',
      instanceName: row.evolution_instance || tenantId
    });
  } catch (error) {
    console.error('[SETTINGS] Erro ao carregar Evolution API:', error);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

export default settingsRouter;
