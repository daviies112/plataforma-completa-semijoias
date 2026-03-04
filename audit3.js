
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

async function main() {
  const result = {};

  result.admin_users = await q("SELECT email, tenant_id, is_active, role, company_name FROM admin_users WHERE email IN ('daviemericko@gmail.com','contato@emericks.com.br')");

  result.supabase_config = await q(`
    SELECT tenant_id, 
      (supabase_url IS NOT NULL AND supabase_url != '') as tem_url,
      (service_role_key IS NOT NULL AND service_role_key != '') as tem_key
    FROM supabase_config 
    WHERE tenant_id IN (SELECT tenant_id FROM admin_users WHERE email IN ('daviemericko@gmail.com','contato@emericks.com.br'))
  `);

  result.app_settings = await q(`
    SELECT tenant_id, company_name, company_slug
    FROM app_settings 
    WHERE tenant_id IN (SELECT tenant_id FROM admin_users WHERE email IN ('daviemericko@gmail.com','contato@emericks.com.br'))
  `);

  result.form_submissions_por_tenant = await q(`
    SELECT tenant_id, COUNT(*) as total FROM form_submissions GROUP BY tenant_id ORDER BY total DESC LIMIT 10
  `);

  result.workspace_boards_por_tenant = await q(`
    SELECT tenant_id, COUNT(*) as total FROM workspace_boards GROUP BY tenant_id ORDER BY total DESC LIMIT 10
  `);

  result.isolamento_form_submissions = await q(`
    SELECT 
      SUM(CASE WHEN tenant_id = 'emericks-tenant' THEN 1 ELSE 0 END) as linhas_emericks,
      SUM(CASE WHEN tenant_id = 'davisemi-joias' THEN 1 ELSE 0 END) as linhas_davisemi,
      SUM(CASE WHEN tenant_id NOT IN ('emericks-tenant','davisemi-joias') AND tenant_id IS NOT NULL THEN 1 ELSE 0 END) as linhas_outros
    FROM form_submissions
  `);

  result.rls_policies = await q(`
    SELECT polpermissive as tipo, COUNT(*) as total
    FROM pg_policy 
    JOIN pg_class ON pg_policy.polrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    GROUP BY polpermissive
  `);

  result.tabelas_sem_rls = await q(`
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.tablename AND p.schemaname = 'public'
    )
    LIMIT 20
  `);

  result.jwt_tenant_id_function = await q(`
    SELECT prosrc FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE proname = 'jwt_tenant_id' AND n.nspname = 'auth'
  `);

  result.form_tenant_mapping = await q(`
    SELECT tenant_id, COUNT(*) as formularios, string_agg(DISTINCT company_slug,',') as slugs
    FROM form_tenant_mapping GROUP BY tenant_id LIMIT 10
  `);

  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
