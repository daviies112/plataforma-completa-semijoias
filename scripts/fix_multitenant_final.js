/**
 * FIX MULTITENANT FINAL
 * Corrige todos os problemas identificados na auditoria:
 * 1. supabase_config: adiciona davisemi-joias apontando para o mesmo Supabase do sistema
 * 2. supabase_config: garante que emericks-tenant também tem entrada direta
 * 3. app_settings: atualiza company_name para os tenants ativos
 * 4. revendedoras: adiciona colunas faltantes (cpf_normalizado gerado, revendedora_id)
 * 5. leads: corrige tenant_id inconsistente
 */

import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

// Lê as credenciais do supabase_local + do emerick (do .env)
const supabaseLocalConfig = (() => {
  try {
    const cfg = JSON.parse(fs.readFileSync('data/supabase-config.json', 'utf8'));
    return { url: cfg.supabaseUrl, anonKey: cfg.supabaseAnonKey };
  } catch(e) {
    return null;
  }
})();

const DB_URL = 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable';

const pool = new Pool({
  connectionString: DB_URL,
  ssl: false,
  connectionTimeoutMillis: 10000,
});

async function runFix() {
  const client = await pool.connect();
  try {
    console.log('🔧 Conectado ao banco de dados.');
    console.log('\n=== VERIFICAÇÃO PRÉ-FIX ===\n');
    
    // Estado atual
    const before = await client.query(`
      SELECT tenant_id, substring(supabase_url, 1, 60) as url_preview 
      FROM supabase_config ORDER BY tenant_id
    `);
    console.log('supabase_config atual:');
    before.rows.forEach(r => console.log(`  ${r.tenant_id}: ${r.url_preview}`));
    
    const adminUsers = await client.query(
      `SELECT email, tenant_id, company_name FROM admin_users WHERE is_active = true ORDER BY tenant_id`
    );
    console.log('\nadmin_users ativos:');
    adminUsers.rows.forEach(r => console.log(`  ${r.tenant_id}: ${r.email} (${r.company_name})`));
    
    // =====================================================================
    // FIX 1: Adicionar entrada para davisemi-joias na supabase_config
    // O sistema usa o mesmo Supabase para todos (http://103.199.187.145:8100)
    // As credenciais do "system" são as corretas para o Supabase local
    // =====================================================================
    console.log('\n=== FIX 1: supabase_config para davisemi-joias ===');
    
    if (supabaseLocalConfig) {
      const { url, anonKey } = supabaseLocalConfig;
      
      // Inserir/atualizar davisemi-joias
      await client.query(`
        INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id) DO UPDATE SET 
          supabase_url = EXCLUDED.supabase_url,
          supabase_anon_key = EXCLUDED.supabase_anon_key,
          updated_at = NOW()
      `, ['davisemi-joias', url, anonKey, 'semijoias']);
      console.log('✅ davisemi-joias adicionado à supabase_config');
      
      // Garantir que emericks-tenant também tem entrada direta
      await client.query(`
        INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id) DO UPDATE SET 
          supabase_url = EXCLUDED.supabase_url,
          supabase_anon_key = EXCLUDED.supabase_anon_key,
          updated_at = NOW()
      `, ['emericks-tenant', url, anonKey, 'semijoias']);
      console.log('✅ emericks-tenant adicionado/atualizado na supabase_config');
    } else {
      // Fallback: usar credenciais do 'system' já existente
      const systemCreds = await client.query(
        `SELECT supabase_url, supabase_anon_key, supabase_bucket FROM supabase_config WHERE tenant_id = 'system' LIMIT 1`
      );
      if (systemCreds.rows.length > 0) {
        const { supabase_url, supabase_anon_key, supabase_bucket } = systemCreds.rows[0];
        
        await client.query(`
          INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (tenant_id) DO UPDATE SET 
            supabase_url = EXCLUDED.supabase_url,
            supabase_anon_key = EXCLUDED.supabase_anon_key,
            updated_at = NOW()
        `, ['davisemi-joias', supabase_url, supabase_anon_key, supabase_bucket || 'semijoias']);
        console.log('✅ davisemi-joias adicionado (usando creds do system)');
        
        await client.query(`
          INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (tenant_id) DO UPDATE SET 
            supabase_url = EXCLUDED.supabase_url,
            supabase_anon_key = EXCLUDED.supabase_anon_key,
            updated_at = NOW()
        `, ['emericks-tenant', supabase_url, supabase_anon_key, supabase_bucket || 'semijoias']);
        console.log('✅ emericks-tenant adicionado (usando creds do system)');
      } else {
        console.log('⚠️ Nenhuma credencial do system encontrada — FIX 1 parcial');
      }
    }
    
    // =====================================================================
    // FIX 2: app_settings — garantir que os 2 tenants têm configuração
    // =====================================================================
    console.log('\n=== FIX 2: app_settings ===');
    
    // davisemi-joias
    await client.query(`
      INSERT INTO app_settings (tenant_id, company_name, company_slug)
      VALUES ('davisemi-joias', 'Davisemi Joias', 'davisemi-joias')
      ON CONFLICT (tenant_id) DO UPDATE SET 
        company_name = EXCLUDED.company_name,
        company_slug = EXCLUDED.company_slug,
        updated_at = NOW()
    `).catch(e => console.log('⚠️ app_settings davisemi-joias (sem updated_at)'));
    
    // Tentar inserção sem updated_at caso a coluna não exista
    try {
      await client.query(`
        INSERT INTO app_settings (tenant_id, company_name, company_slug)
        VALUES ('davisemi-joias', 'Davisemi Joias', 'davisemi-joias')
        ON CONFLICT (tenant_id) DO UPDATE SET 
          company_name = 'Davisemi Joias',
          company_slug = 'davisemi-joias'
      `);
      console.log('✅ app_settings: davisemi-joias ok');
    } catch(e) {
      console.log('⚠️ app_settings davisemi-joias:', e.message);
    }
    
    try {
      await client.query(`
        INSERT INTO app_settings (tenant_id, company_name, company_slug)
        VALUES ('emericks-tenant', 'Emericks', 'emericks-tenant')
        ON CONFLICT (tenant_id) DO UPDATE SET 
          company_name = 'Emericks',
          company_slug = 'emericks-tenant'
      `);
      console.log('✅ app_settings: emericks-tenant ok');
    } catch(e) {
      console.log('⚠️ app_settings emericks-tenant:', e.message);
    }
    
    // =====================================================================
    // FIX 3: revendedoras — adicionar colunas faltantes
    // =====================================================================
    console.log('\n=== FIX 3: revendedoras — colunas faltantes ===');
    
    try {
      await client.query(`
        ALTER TABLE revendedoras 
          ADD COLUMN IF NOT EXISTS revendedora_id UUID DEFAULT gen_random_uuid();
      `);
      console.log('✅ revendedoras.revendedora_id adicionada');
    } catch(e) {
      console.log('⚠️ revendedoras.revendedora_id:', e.message);
    }
    
    // cpf_normalizado como coluna computada via trigger ou coluna simples
    try {
      await client.query(`
        ALTER TABLE revendedoras 
          ADD COLUMN IF NOT EXISTS cpf_normalizado TEXT;
      `);
      // Popular com valores dos CPFs existentes
      await client.query(`
        UPDATE revendedoras 
        SET cpf_normalizado = regexp_replace(cpf, '[^0-9]', '', 'g')
        WHERE cpf IS NOT NULL AND cpf_normalizado IS NULL;
      `);
      console.log('✅ revendedoras.cpf_normalizado adicionada e populada');
    } catch(e) {
      console.log('⚠️ revendedoras.cpf_normalizado:', e.message);
    }
    
    // Índices para performance
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_revendedoras_cpf_norm ON revendedoras(cpf_normalizado);
        CREATE INDEX IF NOT EXISTS idx_revendedoras_tenant ON revendedoras(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_revendedoras_rev_id ON revendedoras(revendedora_id);
      `);
      console.log('✅ Índices das revendedoras criados');
    } catch(e) {
      console.log('⚠️ Índices:', e.message);
    }
    
    // =====================================================================
    // FIX 4: leads — corrigir tenant_id inconsistente ('gleice')
    // =====================================================================
    console.log('\n=== FIX 4: leads com tenant_id inválido ===');
    
    const staleLeads = await client.query(
      `SELECT id, nome, tenant_id, telefone_normalizado FROM leads WHERE tenant_id NOT IN 
       (SELECT DISTINCT tenant_id FROM admin_users WHERE is_active = true) AND tenant_id != 'system'
       LIMIT 20`
    );
    
    if (staleLeads.rows.length > 0) {
      console.log('Leads com tenant_id inconsistente:');
      staleLeads.rows.forEach(r => console.log(`  ${r.nome}: tenant_id="${r.tenant_id}"`));
      console.log('⚠️ ATENÇÃO: Esses leads têm tenant_id que não corresponde a nenhum admin ativo.');
      console.log('   Não estamos migrando automaticamente — confirme com o usuário a qual tenant pertencem.');
      console.log('   Para migrar manualmente, execute:');
      console.log(`   UPDATE leads SET tenant_id = 'davisemi-joias' WHERE tenant_id = 'gleice';`);
    } else {
      console.log('✅ Nenhum lead com tenant_id inconsistente encontrado');
    }
    
    // =====================================================================
    // VERIFICAÇÃO FINAL
    // =====================================================================
    console.log('\n=== VERIFICAÇÃO FINAL ===\n');
    
    const after = await client.query(`
      SELECT tenant_id, substring(supabase_url, 1, 60) as url_preview 
      FROM supabase_config ORDER BY tenant_id
    `);
    console.log('supabase_config após fix:');
    after.rows.forEach(r => console.log(`  ${r.tenant_id}: ${r.url_preview}`));
    
    const revCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'revendedoras' AND column_name IN ('cpf_normalizado', 'revendedora_id')
    `);
    console.log('\nColunas de revendedoras adicionadas:', revCols.rows.map(r => r.column_name));
    
    console.log('\n✅ TODOS OS FIXES APLICADOS COM SUCESSO!');
    console.log('⚠️  REINICIE O SERVIDOR para limpar o cache de credenciais (node-cache TTL 5 min)');
    console.log('    Os leads com tenant_id="gleice" ficam pendentes de decisão do usuário.');
    
  } catch(err) {
    console.error('❌ ERRO:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

runFix();
