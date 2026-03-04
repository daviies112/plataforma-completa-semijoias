
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";
const url = "https://semijoias-supabase.y98g1d.easypanel.host/pg/query";

async function query(sql) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  return r.json();
}

async function main() {
  console.log('\n====== AUDITORIA MULTITENANT COMPLETA ======\n');

  // 1. Verificar os dois tenants
  console.log('--- 1. TENANTS NO ADMIN_USERS ---');
  const users = await query(`
    SELECT email, tenant_id, is_active, role, company_name
    FROM admin_users 
    WHERE email IN ('daviemericko@gmail.com', 'contato@emericks.com.br')
  `);
  console.log(JSON.stringify(users, null, 2));

  // 2. Verificar supabase_config para os dois tenants
  console.log('\n--- 2. SUPABASE_CONFIG por tenant ---');
  const configs = await query(`
    SELECT tenant_id, supabase_url IS NOT NULL as tem_url, service_role_key IS NOT NULL as tem_key
    FROM supabase_config 
    WHERE tenant_id IN (
      SELECT tenant_id FROM admin_users 
      WHERE email IN ('daviemericko@gmail.com', 'contato@emericks.com.br')
    )
  `);
  console.log(JSON.stringify(configs, null, 2));

  // 3. Verificar app_settings por tenant
  console.log('\n--- 3. APP_SETTINGS por tenant ---');
  const appSettings = await query(`
    SELECT tenant_id, company_name, company_slug
    FROM app_settings 
    WHERE tenant_id IN (
      SELECT tenant_id FROM admin_users 
      WHERE email IN ('daviemericko@gmail.com', 'contato@emericks.com.br')
    )
  `);
  console.log(JSON.stringify(appSettings, null, 2));

  // 4. Contar dados por tenant nas tabelas principais
  console.log('\n--- 4. CONTAGEM DE DADOS por tenant ---');
  const tables = ['form_submissions', 'dados_cliente', 'reunioes', 'leads', 'store_products', 'reseller_configs'];
  
  for (const table of tables) {
    try {
      const result = await query(`
        SELECT tenant_id, COUNT(*) as total 
        FROM ${table} 
        GROUP BY tenant_id 
        ORDER BY total DESC
        LIMIT 10
      `);
      if (result.length > 0) {
        console.log(`\n  ${table}:`, JSON.stringify(result, null, 2));
      }
    } catch (e) {
      // tabela pode não existir
    }
  }

  // 5. Verificar RLS funcionando - tabelas sem RLS
  console.log('\n--- 5. TABELAS SEM RLS ---');
  const noRls = await query(`
    SELECT schemaname, tablename 
    FROM pg_tables t
    WHERE schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.tablename AND p.schemaname = t.schemaname
    )
    LIMIT 20
  `);
  console.log(JSON.stringify(noRls, null, 2));

  // 6. Verificar policies restritivas vs permissivas
  console.log('\n--- 6. DISTRIBUIÇÃO DE POLICIES ---');
  const policies = await query(`
    SELECT 
      COUNT(*) as total,
      polpermissive,
      COUNT(CASE WHEN polpermissive = 'PERMISSIVE' THEN 1 END) as permissive,
      COUNT(CASE WHEN polpermissive = 'RESTRICTIVE' THEN 1 END) as restrictive
    FROM pg_policy 
    JOIN pg_class ON pg_policy.polrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    GROUP BY polpermissive
  `);
  console.log(JSON.stringify(policies, null, 2));

  // 7. Verificar form_tenant_mapping
  console.log('\n--- 7. FORM_TENANT_MAPPING ---');
  const mapping = await query(`
    SELECT tenant_id, form_id, company_slug 
    FROM form_tenant_mapping 
    WHERE tenant_id IN (
      SELECT tenant_id FROM admin_users 
      WHERE email IN ('daviemericko@gmail.com', 'contato@emericks.com.br')
    )
    LIMIT 20
  `);
  console.log(JSON.stringify(mapping, null, 2));

  // 8. Verificar função jwt_tenant_id
  console.log('\n--- 8. FUNÇÃO auth.jwt_tenant_id ---');
  const fn = await query(`
    SELECT prosrc FROM pg_proc 
    WHERE proname = 'jwt_tenant_id' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
  `);
  console.log(JSON.stringify(fn, null, 2));

  // 9. Verificar logs_acesso dos dois usuários
  console.log('\n--- 9. ÚLTIMOS LOGINS ---');
  const logs = await query(`
    SELECT email, sucesso, mensagem, created_at 
    FROM logs_acesso 
    WHERE email IN ('daviemericko@gmail.com', 'contato@emericks.com.br')
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  console.log(JSON.stringify(logs, null, 2));

  console.log('\n====== FIM DA AUDITORIA ======\n');
}

main().catch(console.error);
