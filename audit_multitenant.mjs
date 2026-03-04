/**
 * AUDITORIA COMPLETA MULTITENANT
 * Roda contra o PostgreSQL do Supabase (acesso direto)
 */
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable',
  connectionTimeoutMillis: 15000,
});

async function q(client, sql) {
  try { const r = await client.query(sql); return r.rows; }
  catch(e) { return [{ error: e.message }]; }
}

async function run() {
  const c = await pool.connect();
  console.log('===== AUDITORIA MULTITENANT — SUPABASE POSTGRESQL =====\n');

  // 1. RLS por tabela
  console.log('=== [1] STATUS RLS POR TABELA ===');
  const rls = await q(c, `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
  const rlsOn = rls.filter(r => r.rowsecurity === true).map(r => r.tablename);
  const rlsOff = rls.filter(r => r.rowsecurity === false).map(r => r.tablename);
  console.log(`RLS ON (${rlsOn.length}): ${rlsOn.join(', ')}`);
  console.log(`RLS OFF (${rlsOff.length}): ${rlsOff.join(', ')}\n`);

  // 2. Policies existentes
  console.log('=== [2] POLICIES RLS EXISTENTES ===');
  const policies = await q(c, `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname='public' ORDER BY tablename, cmd`);
  if (policies[0]?.error) { console.log('ERRO:', policies[0].error); }
  else { 
    for (const p of policies) {
      const open = (!p.qual || p.qual === 'true') ? ' ⚠️ POLICY ABERTA!' : '';
      console.log(`  ${p.tablename}.${p.cmd}: "${p.policyname}"${open}`);
    }
    if (policies.length === 0) console.log('  ❌ NENHUMA POLICY ENCONTRADA!');
  }
  console.log();

  // 3. Tabelas com tenant_id
  console.log('=== [3] TABELAS COM / SEM tenant_id ===');
  const withTenant = await q(c, `SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='tenant_id' ORDER BY table_name`);
  const allTables = await q(c, `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`);
  const withIds = new Set(withTenant.map(r => r.table_name));
  const allIds = allTables.map(r => r.table_name);
  const withoutTenant = allIds.filter(t => !withIds.has(t));
  console.log(`Com tenant_id (${withIds.size}): ${[...withIds].join(', ')}`);
  console.log(`SEM tenant_id (${withoutTenant.length}): ${withoutTenant.join(', ')}\n`);

  // 4. tenant_id nullable
  console.log('=== [4] tenant_id NULLABLE (risco) ===');
  const nullable = await q(c, `SELECT table_name, is_nullable FROM information_schema.columns WHERE table_schema='public' AND column_name='tenant_id' AND is_nullable='YES' ORDER BY table_name`);
  if (nullable.length === 0) console.log('  ✅ Nenhuma tabela tem tenant_id nullable');
  else for (const r of nullable) console.log(`  ⚠️  ${r.table_name}: tenant_id é NULLABLE`);
  console.log();

  // 5. Tabelas SEM índice em tenant_id
  console.log('=== [5] ÍNDICES EM tenant_id ===');
  const noIndex = await q(c, `
    SELECT t.table_name FROM information_schema.columns t
    WHERE t.column_name='tenant_id' AND t.table_schema='public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_indexes pi WHERE pi.schemaname='public'
      AND pi.tablename=t.table_name AND pi.indexdef ILIKE '%tenant_id%'
    ) ORDER BY t.table_name`);
  if (noIndex.length === 0) console.log('  ✅ Todas as tabelas têm índice em tenant_id');
  else for (const r of noIndex) console.log(`  ❌ ${r.table_name}: SEM ÍNDICE em tenant_id`);
  console.log();

  // 6. RLS ativo sem policy
  console.log('=== [6] RLS ATIVO SEM POLICY (bloqueio total) ===');
  const rlsNoPol = await q(c, `
    SELECT t.tablename FROM pg_tables t WHERE t.schemaname='public' AND t.rowsecurity=true
    AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=t.tablename)`);
  if (rlsNoPol.length === 0) console.log('  ✅ Nenhuma tabela com RLS sem policy');
  else for (const r of rlsNoPol) console.log(`  🚫 ${r.tablename}: RLS ON mas SEM policy — bloqueia tudo!`);
  console.log();

  // 7. Policies abertas
  console.log('=== [7] POLICIES PERMISSIVAS (perigo) ===');
  const open = await q(c, `SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' AND (qual IS NULL OR qual='true' OR with_check='true')`);
  if (open.length === 0) console.log('  ✅ Nenhuma policy aberta encontrada');
  else for (const r of open) console.log(`  🚨 PERIGO: Policy "${r.policyname}" em ${r.tablename} (${r.cmd}) está ABERTA!`);
  console.log();

  // 8. Distribuição de dados por tenant
  console.log('=== [8] DISTRIBUIÇÃO DE DADOS POR TENANT ===');
  for (const table of ['forms', 'reunioes', 'leads', 'workspace_boards', 'workspace_pages', 'dados_cliente', 'form_submissions_compliance_tracking']) {
    try {
      const rows = await q(c, `SELECT tenant_id, COUNT(*) as cnt FROM public.${table} GROUP BY tenant_id ORDER BY cnt DESC LIMIT 5`);
      if (rows[0]?.error) continue;
      if (rows.length > 0) console.log(`  ${table}: ${rows.map(r => `"${r.tenant_id}"=${r.cnt}`).join(', ')}`);
    } catch {}
  }
  console.log();

  // 9. Função get_current_tenant / set_tenant_context
  console.log('=== [9] FUNÇÕES UTILITÁRIAS ===');
  const fns = await q(c, `SELECT proname FROM pg_proc WHERE proname IN ('get_current_tenant','set_tenant_context','get_current_tenant_id','custom_access_token_hook') ORDER BY proname`);
  const fnNames = fns.map(r => r.proname);
  for (const fn of ['get_current_tenant', 'get_current_tenant_id', 'set_tenant_context', 'custom_access_token_hook']) {
    const has = fnNames.includes(fn);
    console.log(`  ${has ? '✅' : '❌'} ${fn}: ${has ? 'EXISTE' : 'NÃO EXISTE'}`);
  }
  console.log();

  // 10. Tabela tenants central
  console.log('=== [10] TABELA CENTRAL tenants ===');
  const hasTenants = await q(c, `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='tenants'`);
  console.log(`  ${hasTenants.length > 0 ? '✅' : '❌'} Tabela 'tenants': ${hasTenants.length > 0 ? 'EXISTE' : 'NÃO EXISTE'}`);
  const hasUserProfiles = await q(c, `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles'`);
  console.log(`  ${hasUserProfiles.length > 0 ? '✅' : '❌'} Tabela 'user_profiles': ${hasUserProfiles.length > 0 ? 'EXISTE' : 'NÃO EXISTE'}`);
  console.log();

  // 11. Buckets storage
  console.log('=== [11] STORAGE BUCKETS ===');
  try {
    const buckets = await q(c, `SELECT id, name, public FROM storage.buckets`);
    if (buckets[0]?.error) console.log(' (storage schema não acessível via pg direto)');
    else if (buckets.length === 0) console.log('  Nenhum bucket encontrado');
    else for (const b of buckets) console.log(`  ${b.public ? '🚨 PÚBLICO' : '✅ privado'}: bucket "${b.name}"`);
  } catch(e) { console.log(`  (storage: ${e.message})`); }
  console.log();

  // 12. audit_logs
  console.log('=== [12] AUDIT LOGS ===');
  const hasAudit = await q(c, `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs'`);
  console.log(`  ${hasAudit.length > 0 ? '✅' : '❌'} Tabela 'audit_logs': ${hasAudit.length > 0 ? 'EXISTE' : 'NÃO EXISTE'}`);

  c.release();
  await pool.end();
  console.log('\n===== FIM DA AUDITORIA =====');
}
run().catch(e => console.error('FATAL:', e.message));
