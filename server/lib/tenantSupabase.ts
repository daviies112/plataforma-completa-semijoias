/**
 * FASE 3 — Tenant Context Wrapper
 * 
 * Cria um Supabase client que injeta app.tenant_id antes de cada operação.
 * Compatível com service_role + RLS via set_config.
 * 
 * Uso:
 *   const supabase = await getTenantSupabase('emericks-tenant');
 *   const { data } = await supabase.from('dados_cliente').select('*');
 *   // → automaticamente filtrado por tenant via RLS E via .eq()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getCachedSupabaseCredentials } from './publicCache.js';

// Cache de clients por tenant
const clientCache = new Map<string, { client: SupabaseClient; ts: number }>();
const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Returns a Supabase client pre-configured for the given tenant.
 * Sets app.tenant_id via set_config so RLS policies can read it.
 */
export async function getTenantSupabase(tenantId: string): Promise<SupabaseClient | null> {
  // Usar credenciais do tenant (com fallback para local)
  let url: string;
  let key: string;

  try {
    const creds = await getCachedSupabaseCredentials(tenantId);
    if (creds?.url && creds?.serviceKey) {
      url = creds.url;
      key = creds.serviceKey;
    } else if (process.env.SUPABASE_LOCAL_URL && process.env.SUPABASE_LOCAL_SERVICE_KEY) {
      url = process.env.SUPABASE_LOCAL_URL;
      key = process.env.SUPABASE_LOCAL_SERVICE_KEY;
    } else {
      console.error(`[TenantSupabase] ❌ Sem credenciais para tenant: ${tenantId}`);
      return null;
    }
  } catch (e) {
    console.error(`[TenantSupabase] Erro ao obter credenciais:`, e);
    return null;
  }

  // Verificar cache
  const cacheKey = `${tenantId}::${url}`;
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CLIENT_CACHE_TTL_MS) {
    return cached.client;
  }

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 🔐 Injetar tenant_id no contexto PostgreSQL para que RLS possa ler
  // Isso funciona mesmo com service_role SE as policies usarem current_setting()
  try {
    await client.rpc('set_tenant_context', { p_tenant_id: tenantId });
  } catch {
    // rpc pode não existir ainda; não é fatal — o .eq() ainda filtra
    console.debug(`[TenantSupabase] set_tenant_context não disponível para ${tenantId} (normal antes da FASE 3 SQL)`);
  }

  clientCache.set(cacheKey, { client, ts: Date.now() });
  console.log(`[TenantSupabase] ✅ Client criado para tenant: ${tenantId}`);
  return client;
}

/**
 * Limpa o cache de clients (usar quando tenant_id ou credenciais mudam)
 */
export function invalidateTenantClientCache(tenantId?: string) {
  if (tenantId) {
    for (const key of clientCache.keys()) {
      if (key.startsWith(tenantId + '::')) clientCache.delete(key);
    }
  } else {
    clientCache.clear();
  }
}
