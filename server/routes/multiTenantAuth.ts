import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseOwner, SUPABASE_CONFIGURED } from '../config/supabaseOwner';
import { saveCompanySlug, invalidateSlugCache } from '../lib/tenantSlug';

function getJwtSecret(): string {
  // 🔐 JWT Secret obrigatório — nunca usar fallback hardcoded em produção
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    const msg = '[AUTH] CRÍTICO: JWT_SECRET não configurado! Defina no arquivo .env';
    console.error(msg);
    // Gera secret randômico por sessão — tokens não persistem após restart
    return require('crypto').randomBytes(64).toString('hex');
  }
  return secret;
}

function generateToken(payload: Record<string, any>): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

function normalizeSlug(name: string): string {
  return name.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function autoSetCompanySlug(tenantId: string, companyName: string | null | undefined) {
  if (!companyName || !companyName.trim()) return;
  const slug = normalizeSlug(companyName);
  if (!slug) return;
  try {
    await saveCompanySlug(tenantId, slug);
    console.log(`✅ [AutoSlug] Company slug set to "${slug}" for tenant ${tenantId} (from company_name: "${companyName}")`);
  } catch (err) {
    console.warn(`⚠️ [AutoSlug] Failed to set slug for ${tenantId}:`, err);
  }
}

async function fetchCompanyNameFromOwner(adminId: string): Promise<string | null> {
  if (!supabaseOwner) return null;
  try {
    const { data, error } = await supabaseOwner
      .from('admin_users')
      .select('company_name')
      .eq('id', adminId)
      .single();
    if (!error && data?.company_name) {
      return data.company_name;
    }
  } catch (e) {
    console.warn('[AutoSlug] Could not fetch company_name:', e);
  }
  return null;
}

async function handleDirectLogin(req: Request, res: Response, adminData: any, email: string, senha: string) {
  const passwordHash = adminData.password_hash;
  console.log(`🔍 [AUTH] handleDirectLogin - email: ${email}, has password_hash: ${!!passwordHash}, hash prefix: ${passwordHash?.substring(0, 10) || 'none'}, tenant_id: ${adminData.tenant_id || 'none'}`);
  
  if (!passwordHash) {
    console.error('[AUTH] Usuário sem password_hash:', email);
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }

  const isValid = await bcrypt.compare(senha, passwordHash);
  console.log(`🔍 [AUTH] bcrypt.compare result: ${isValid}`);
  if (!isValid) {
    console.log(`❌ [AUTH] Senha incorreta para: ${email}`);
    supabaseOwner?.from('logs_acesso').insert({
      email, sucesso: false, ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      mensagem: 'Senha incorreta (login direto)'
    }).then().catch(console.error);
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }

  // 🔑 CANONICAL TENANT_ID: o valor soberano é admin_users.tenant_id (como salvo no banco).
  // Prioridade: adminData.tenant_id > normalizeSlug(company_name) > fallback
  // NUNCA gerar slug de company_name se tenant_id já existe no banco — isso causava mismatch
  // porque dados eram salvos com 'emericks-tenant' mas login gerava 'emericks'.
  const companySlug = adminData.company_name ? normalizeSlug(adminData.company_name) : null;
  const rawTenantId = adminData.tenant_id?.trim() || null;
  // Normalize to lowercase to match supabase_config keys (prevents 'Davisemijoias' ≠ 'davisemijoias' mismatch)
  const tenantId = (rawTenantId || companySlug || `dev-${email.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`).toLowerCase();
  const userName = adminData.nome || adminData.name || adminData.company_name || email.split('@')[0];

  req.session.userId = adminData.id || tenantId;
  req.session.userEmail = email;
  req.session.userName = userName;
  req.session.tenantId = tenantId;
  req.session.userRole = adminData.role || 'admin';
  req.session.companyName = adminData.company_name || userName;

  if (adminData.company_name) {
    await autoSetCompanySlug(tenantId, adminData.company_name);
  }

  // 🚀 AUTO-PROVISIONING: Se o tenant não tem supabase_config, criar automaticamente
  // Isso garante que novos tenants criados diretamente no banco admin_users funcionem
  try {
    const { pool } = await import('../db');
    const existing = await pool.query(
      'SELECT id FROM supabase_config WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );
    if (existing.rows.length === 0) {
      console.log(`🆕 [AutoProvision] Tenant "${tenantId}" sem supabase_config — provisionando...`);
      const { adminAuthService } = await import('../services/adminAuth');
      await adminAuthService.provisionNewTenant(tenantId, adminData.company_name || adminData.name || tenantId);
    }
  } catch (provErr: any) {
    console.warn(`[AutoProvision] Falha ao verificar/provisionar tenant ${tenantId}:`, provErr.message);
  }

  supabaseOwner?.from('logs_acesso').insert({
    admin_id: adminData.id, email, sucesso: true,
    ip_address: req.ip, user_agent: req.headers['user-agent'],
    mensagem: 'Login direto bem-sucedido'
  }).then().catch(console.error);

  supabaseOwner?.from('admin_users').update({ last_login: new Date().toISOString() })
    .eq('id', adminData.id).then().catch(console.error);

  console.log(`✅ [AUTH] Login direto bem-sucedido para: ${email} (tenant: ${tenantId})`);
  console.log('[LOGIN][DEBUG] Iniciando save da sessão, sessionID:', req.sessionID);

  return req.session.save((err) => {
    console.log('[LOGIN][DEBUG] session.save callback - err:', err);
    console.log('[LOGIN][DEBUG] session.save callback - session:', JSON.stringify(req.session));
    if (err) {
      console.error('[Session] Erro ao salvar sessão:', err);
      return res.status(500).json({ error: 'Erro ao criar sessão' });
    }
    const token = generateToken({
      userId: adminData.id || tenantId,
      email: email,
      name: userName,
      clientId: tenantId,
      tenantId: tenantId,
      role: adminData.role || 'admin',
      companyName: adminData.company_name || userName
    });
    return res.json({
      success: true,
      redirect: '/dashboard',
      token,
      user: { nome: userName, email, company_name: adminData.company_name || userName, tenant_id: tenantId }
    });
  });
}

const router = express.Router();

// Rota de Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // DEVELOPMENT BYPASS: Quando auth não está configurado, permitir login mock
    if (!SUPABASE_CONFIGURED) {
      const { email, senha: _senha, password: _pw } = req.body;
      const senha = _senha || _pw;
      
      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }
      
      // 🔐 MULTI-TENANT: Priority to company_name normalized as slug
      // If company_name is provided in body, use it, otherwise use email
      const companySlug = req.body.company_name ? normalizeSlug(req.body.company_name) : null;
      const tenantId = companySlug || `dev-${email.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      
      // Criar sessão mock para desenvolvimento
      req.session.userId = tenantId;
      req.session.userEmail = email;
      req.session.userName = `Dev User (${email})`;
      req.session.tenantId = tenantId; // Cada email é um tenant 100% independente
      req.session.userRole = 'admin'; // Definir role como admin para dev bypass
      
      console.log(`⚠️ AVISO: Login de desenvolvimento aceito (auth desabilitado) - tenantId: ${tenantId}`);
      console.log(`🔐 [MULTI-TENANT] Tenant isolado criado para: ${email}`);

      // IMPORTANT: Save session explicitly before responding to ensure cookie is persisted
      console.log('[LOGIN][DEBUG] Iniciando save da sessão, sessionID:', req.sessionID);
      return req.session.save((err) => {
        console.log('[LOGIN][DEBUG] session.save callback - err:', err);
        console.log('[LOGIN][DEBUG] session.save callback - session:', JSON.stringify(req.session));
        if (err) {
          console.error('[Session] Erro ao salvar sessão:', err);
          return res.status(500).json({ error: 'Erro ao criar sessão' });
        }
        console.log(`✅ [Session] Sessão salva para tenant: ${tenantId}`);
        const token = generateToken({
          userId: tenantId,
          email: email,
          name: `Dev User (${email})`,
          clientId: tenantId,
          tenantId: tenantId,
          role: 'admin'
        });
        return res.json({ 
          success: true, 
          redirect: '/dashboard',
          token,
          user: {
            nome: `Dev User (${email})`,
            email: email
          }
        });
      });
    }

    const { email, senha: _senha, password: _pw } = req.body;
      const senha = _senha || _pw;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // ✅ LOGIN DIRETO: admin_users + bcrypt (sem RPC inexistente)
    // ✅ LOGIN DIRETO: Tentar DB Drizzle primeiro (PostgreSQL local), fallback para admin_users + bcrypt
    console.log(`🔍 [AUTH] Login via banco de dados local para: ${email}`);
    
    let adminData: any = null;
    let queryErr: any = null;

try {
      const { pool } = await import('../db');
      console.log('🔍 [AUTH] Tentando via Host Postgres (raw SQL) para:', email);
      
      const resPg = await pool.query(
        'SELECT * FROM admin_users WHERE email = $1 AND is_active = true LIMIT 1',
        [email]
      );
      
      if (resPg.rows.length > 0) {
        const localUser = resPg.rows[0];
        adminData = {
          ...localUser,
          nome: localUser.name || localUser.nome || localUser.company_name,
          password_hash: localUser.password_hash || localUser.passwordHash,
          company_name: localUser.company_name || localUser.companyName,
          tenant_id: localUser.tenant_id || localUser.tenantId,
          is_active: localUser.is_active || localUser.isActive,
          role: localUser.role || 'admin',
          id: localUser.id
        };
        console.log('✅ [AUTH] Local DB user found via raw SQL no Host!');
      } else {
        console.log('⚠️ [AUTH] Usuário não encontrado no Host DB (raw SQL).');
      }
    } catch (e) {
      console.error('[AUTH] Local DB query failed', e);
    }

    if (!adminData && supabaseOwner) {
      console.log(`🔍 [AUTH] Fallback para supabaseOwner REST: ${email}`);
      const result = await supabaseOwner
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
      
      adminData = result.data;
      queryErr = result.error;
    }

    console.log(`🔍 [AUTH] Query admin_users final - error: ${queryErr?.code || 'none'}, found: ${!!adminData}`);

    if (!adminData) {
      console.log(`❌ [AUTH] Usuário não encontrado: ${email}`);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // 🔑 ID SOBERANO: usar admin_users.tenant_id diretamente (como gravado no banco).
    // NUNCA sobrescrever com normalizeSlug(company_name) — isso gerava "emericks"
    // enquanto os dados estavam gravados sob "emericks-tenant".
    // Prioridade: admin_users.tenant_id (lowercase+trim) > normalizeSlug(company_name) > id
    const rawDbTenantId = adminData.tenant_id?.trim();
    const sovereignTenant = rawDbTenantId
      ? rawDbTenantId.toLowerCase().replace(/\s+/g, '-')  // apenas sanitiza, não normaliza
      : (adminData.company_name ? normalizeSlug(adminData.company_name) : adminData.id);

    const normalizedAdmin = {
      ...adminData,
      nome: adminData.nome || adminData.name || adminData.company_name,
      tenant_id: sovereignTenant,
      clientId: adminData.id
    };
    return await handleDirectLogin(req, res, normalizedAdmin, email, senha);

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Rota de Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ success: true, redirect: '/login' });
  });
});

// Rota para verificar sessão
router.get('/check-session', (req: Request, res: Response) => {
  if (req.session && req.session.userId) {
    res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        nome: req.session.userName,
        email: req.session.userEmail,
        tenant_id: req.session.tenantId,
        role: req.session.userRole || 'admin',
        company_name: req.session.companyName || req.session.userName
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Rota para obter informações do usuário logado
router.get('/user-info', (req: Request, res: Response) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  res.json({
    nome: req.session.userName,
    email: req.session.userEmail,
    company_name: req.session.companyName || req.session.userName,
    hasSupabaseConfig: true
  });
});

// Rota para obter o tenant_id da sessão atual
router.get('/session/tenant', (req: Request, res: Response) => {
  if (req.session && req.session.tenantId) {
    return res.json({ tenant_id: req.session.tenantId });
  }

  // Em desenvolvimento, retornar o tenant padrão configurado via variável de ambiente
  if (process.env.NODE_ENV === 'development') {
    const devTenant = process.env.DEV_TENANT_ID || 'emericks-tenant';
    return res.json({ tenant_id: devTenant });
  }

  res.status(401).json({ error: 'Sessão expirada' });
});

// ============================================================================
// POST /admin/unify-tenant
// Migra todos os registros de tenant_id antigos (ex: 'emericks', 'emericks-tenant')
// para o ID soberano (ex: 'emerick') em todas as 157 tabelas Supabase.
// ============================================================================
router.post('/admin/unify-tenant', async (req: Request, res: Response) => {
  try {
    const {
      targetTenant = 'emerick',
      sourceTenants = ['emericks', 'emericks-tenant'],
    } = req.body as { targetTenant?: string; sourceTenants?: string[] };

    const masterUrl = process.env.SUPABASE_LOCAL_URL;
    const masterKey = process.env.SUPABASE_LOCAL_SERVICE_KEY;

    if (!masterUrl || !masterKey) {
      return res.status(500).json({
        success: false,
        error: 'Variáveis SUPABASE_LOCAL_URL e SUPABASE_LOCAL_SERVICE_KEY não configuradas',
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(masterUrl, masterKey);

    const fs = await import('fs');
    const path = await import('path');

    let tables: string[] = [];
    try {
      const listPath = path.resolve(process.cwd(), 'tables_157.json');
      if (fs.existsSync(listPath)) {
        tables = JSON.parse(fs.readFileSync(listPath, 'utf8'));
      }
    } catch (_) {
      // Fallback para tabelas críticas conhecidas
    }
    if (tables.length === 0) {
      tables = [
        'dados_cliente', 'form_submissions_compliance', 'reunioes',
        'forms', 'leads', 'app_settings', 'tenants_registry',
        'form_submissions', 'workspace_boards', 'workspace_pages',
        'workspace_databases', 'reseller_configs', 'whatsapp_labels',
        'cpf_compliance_resultados', 'store_products',
      ];
    }

    const summary: Record<string, { tabelas: Record<string, number>; totalLinhas: number }> = {};

    for (const source of sourceTenants) {
      summary[source] = { tabelas: {}, totalLinhas: 0 };

      const chunkSize = 10;
      for (let i = 0; i < tables.length; i += chunkSize) {
        const chunk = tables.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (table) => {
            try {
              const { data, error } = await supabase
                .from(table)
                .update({ tenant_id: targetTenant })
                .eq('tenant_id', source)
                .select('id');

              if (!error && data && data.length > 0) {
                summary[source].tabelas[table] = data.length;
                summary[source].totalLinhas += data.length;
              }

              // Também atualizar coluna tenant_slug em tenants_registry
              if (table === 'tenants_registry') {
                await supabase
                  .from(table)
                  .update({ tenant_slug: targetTenant })
                  .eq('tenant_slug', source);
              }
            } catch (_) {
              // Silenciosamente ignorar tabelas sem tenant_id
            }
          })
        );
      }
    }

    console.log(`[unify-tenant] ✅ Migração concluída. Destino: "${targetTenant}"`, JSON.stringify(summary));
    return res.json({ success: true, targetTenant, sourceTenants, summary });
  } catch (error) {
    console.error('[unify-tenant] ❌ Erro:', error);
    return res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
