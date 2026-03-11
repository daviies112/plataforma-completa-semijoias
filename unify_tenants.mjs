/**
 * FASE 2 (CORRECTED) — Unificação via Supabase client (não via PostgreSQL direta)
 * O Supabase local usa banco separado do PostgreSQL da plataforma
 */
import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://semijoias-supabase.y98g1d.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const migrations = [
  {
    targetTenant: 'emericks-tenant',
    sourceTenants: ['emerick', 'emericks', 'emerick-tenant', 'Emerick', 'Emericks'],
  },
  {
    targetTenant: 'davisemi-joias',
    sourceTenants: ['davisemijoias', 'davis-emi-joias', 'davidsemijoias', 'Davisemijoias', 'davisemi_joias'],
  },
];

// Tabelas no Supabase a migrar
const tables = [
  'forms', 'reunioes', 'leads', 'workspace_boards', 'workspace_pages',
  'dados_cliente', 'form_submissions_compliance_tracking', 'form_submissions',
  'cpf_compliance_results', 'formularios', 'chat_messages', 'reuniao_compliance',
];

async function migrateTable(table, fromTenantId, toTenantId) {
  const { data, error } = await s
    .from(table)
    .update({ tenant_id: toTenantId })
    .eq('tenant_id', fromTenantId)
    .select('id');
  
  if (error) {
    if (!error.message.includes('does not exist') && !error.message.includes('column') && !error.message.includes('relation')) {
      console.warn(`  ⚠️  ${table} [${fromTenantId}→${toTenantId}]: ${error.message}`);
    }
    return 0;
  }
  return data?.length || 0;
}

async function run() {
  console.log('🔀 FASE 2 — Unificação via Supabase Client\n');
  
  for (const { targetTenant, sourceTenants } of migrations) {
    console.log(`\n📦 Canonical: "${targetTenant}"`);
    for (const table of tables) {
      for (const srcTenant of sourceTenants) {
        const count = await migrateTable(table, srcTenant, targetTenant);
        if (count > 0) {
          console.log(`  ✅ ${table}: ${count} registros "${srcTenant}" → "${targetTenant}"`);
        }
      }
    }
  }

  // Relatório final
  console.log('\n📊 Estado FINAL por tabela:\n');
  for (const table of tables) {
    try {
      const { data } = await s.from(table).select('tenant_id');
      if (data && data.length > 0) {
        const counts = {};
        for (const r of data) { const k = r.tenant_id||'NULL'; counts[k]=(counts[k]||0)+1; }
        console.log(`  ${table}:`, JSON.stringify(counts));
      }
    } catch {}
  }

  console.log('\n✅ Unificação Supabase concluída!');
}

run().catch(e => console.error('FATAL:', e.message));
