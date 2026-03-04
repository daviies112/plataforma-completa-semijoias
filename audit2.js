
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";
const base = "https://semijoias-supabase.y98g1d.easypanel.host";

async function q(sql) {
  const r = await fetch(`${base}/pg/query`, {
    method: 'POST',
    headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  return r.json();
}

async function rest(table, params = '') {
  const r = await fetch(`${base}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
  });
  return r.json();
}

const separator = () => console.log('\n' + '='.repeat(60));

async function main() {
  separator();
  console.log('1. ADMIN_USERS - OS DOIS TENANTS');
  separator();
  const users = await q("SELECT email, tenant_id, is_active, role, company_name FROM admin_users WHERE email IN ('daviemericko@gmail.com','contato@emericks.com.br')");
  console.table(users);

  separator();
  console.log('2. SUPABASE_CONFIG - Configurações por tenant');
  separator();
  const cfg = await q(`
    SELECT tenant_id, 
           CASE WHEN supabase_url IS NOT NULL AND supabase_url != '' THEN 'SIM' ELSE 'NÃO' END as tem_url,
           CASE WHEN service_role_key IS NOT NULL AND service_role_key != '' THEN 'SIM' ELSE 'NÃO' END as tem_key
    FROM supabase_config 
    WHERE tenant_id IN (
      SELECT tenant_id FROM admin_users WHERE email IN ('daviemericko@gmail.com','contato@emericks.com.br')
    )
  `);
  console.table(cfg);

  separator();
  console.log('3. APP_SETTINGS - Configurações de empresa por tenant');
  separator();
  const app = await q(`
    SELECT tenant_id, company_name, company_slug, created_at::date as criado
    FROM app_settings 
    WHERE tenant_id IN (
      SELECT tenant_id FROM admin_users WHERE email IN ('daviemericko@gmail.com','contato@emericks.com.br')
    )
  `);
  console.table(app);

  separator();
  console.log('4. TODOS OS TENANT_IDs ÚNICOS NO BANCO (top 20 tabelas)');
  separator();
  const tables = ['form_submissions','dados_cliente','reunioes','store_products','workspace_boards','kanban_leads'];
  for (const t of tables) {
    try {
      const result = await q(`SELECT tenant_id, COUNT(*) as registros FROM ${t} GROUP BY tenant_id ORDER BY registros DESC LIMIT 5`);
      if (Array.isArray(result) && result.length > 0) {
        console.log(`\n  📦 ${t}:`);
        console.table(result);
      }
    } catch(e) {}
  }

  separator();
  console.log('5. ISOLAMENTO - Dados do Emericks acessando Davi e vice-versa');
  separator();
  // Verificar se policies impedem cross-tenant
  const crossCheck = await q(`
    SELECT 
      'form_submissions' as tabela,
      COUNT(*) FILTER (WHERE tenant_id = 'emericks-tenant') as emericks,
      COUNT(*) FILTER (WHERE tenant_id = 'davisemi-joias') as davisemi,
      COUNT(*) FILTER (WHERE tenant_id NOT IN ('emericks-tenant','davisemi-joias') AND tenant_id IS NOT NULL) as outros
    FROM form_submissions
  `);
  console.table(crossCheck);

  separator();
  console.log('6. POLÍTICAS RLS - Resumo');
  separator();
  const rls = await q(`
    SELECT 
      polpermissive as tipo,
      COUNT(*) as total
    FROM pg_policy 
    JOIN pg_class ON pg_policy.polrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    GROUP BY polpermissive
  `);
  console.table(rls);

  separator();
  console.log('7. TABELAS SEM NENHUMA POLÍTICA RLS');
  separator();
  const noRls = await q(`
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.tablename AND p.schemaname = 'public'
    )
    LIMIT 15
  `);
  console.table(noRls);

  separator();
  console.log('8. FUNCTION auth.jwt_tenant_id - Verificar se está correta');
  separator();
  const fn = await q(`
    SELECT prosrc FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE proname = 'jwt_tenant_id' AND n.nspname = 'auth'
  `);
  if (fn.length > 0) console.log('Corpo da função:\n', fn[0].prosrc);
  else console.log('ERRO: Função não encontrada!');

  separator();
  console.log('9. FORM_TENANT_MAPPING - Mapeamento de formulários por tenant');
  separator();
  const ftm = await q(`
    SELECT tenant_id, COUNT(*) as formularios, 
           array_agg(DISTINCT company_slug) as slugs
    FROM form_tenant_mapping GROUP BY tenant_id LIMIT 10
  `);
  console.table(ftm);

  separator();
  console.log('AUDITORIA CONCLUÍDA');
  separator();
}

main().catch(e => console.error('ERRO:', e.message));
