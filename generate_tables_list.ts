import { createClient } from '@supabase/supabase-js';

// Usar service_role_key para bypass de RLS
const SUPABASE_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function getAllTableNames(): Promise<string[]> {
  console.log('📋 Buscando lista de todas as tabelas do Supabase...');
  
  const { data, error } = await supabase
    .rpc('get_tables_list')
    .select('*');
  
  if (error || !data) {
    // Fallback: query directly via REST
    const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SERVICE_KEY}`);
    const json = await res.json();
    const tables = Object.keys(json?.paths || {})
      .filter(p => !p.includes('{') && p !== '/')
      .map(p => p.replace(/^\//, ''));
    return tables;
  }
  
  return data.map((r: any) => r.table_name || r.tablename || r);
}

async function generateTablesJson() {
  // Method 1: Try RPC
  let tables: string[] = [];
  
  // Method 2: Use information_schema via direct query
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
        })
      }
    );
    
    if (res.ok) {
      const data = await res.json();
      tables = data.map((r: any) => r.table_name);
    }
  } catch(e) {}
  
  // Method 3: Query each known table
  if (tables.length === 0) {
    const knownTables = [
      'dados_cliente', 'form_submissions_compliance_tracking', 'form_submissions',
      'cpf_compliance_results', 'reunioes', 'reuniao', 'n8n_chat_histories',
      'formulario_envios', 'forms', 'tenants_registry', 'app_settings',
      'supabase_config', 'leads', 'store_products', 'whatsapp_labels',
      'reseller_configs', 'workspace_pages', 'workspace_boards', 'workspace_databases',
      'clientes_completos', 'chat_histories', 'form_templates', 'label_logs',
      'product_catalog', 'orders', 'order_items', 'customers', 'inventory',
      'invoices', 'payments', 'subscriptions', 'users', 'profiles', 'sessions',
      'notifications', 'audit_logs', 'settings', 'configurations', 'api_keys',
      'webhooks', 'events', 'analytics', 'reports', 'dashboards', 'widgets',
      'files', 'media', 'uploads', 'documents', 'contracts', 'proposals',
      'tasks', 'projects', 'teams', 'members', 'roles', 'permissions',
      'categories', 'tags', 'labels', 'notes', 'comments', 'activities',
      'messages', 'conversations', 'channels', 'contacts', 'companies', 'deals',
      'pipelines', 'stages', 'automation_rules', 'triggers', 'actions',
      'sequences', 'campaigns', 'templates_email', 'email_logs',
      'sms_logs', 'whatsapp_logs', 'call_logs', 'meeting_logs',
      'crm_contacts', 'crm_companies', 'crm_deals', 'crm_activities',
      'ecommerce_products', 'ecommerce_orders', 'ecommerce_customers',
      'ecommerce_categories', 'ecommerce_inventory', 'ecommerce_payments',
      'revendedoras', 'revendedora_orders', 'revendedora_inventory',
      'revendedora_payments', 'revendedora_commissions',
      'cpf_queries', 'cpf_results', 'kyc_checks', 'compliance_results',
      'form_drafts', 'form_responses', 'form_analytics',
      'room_design_config', 'room_design_themes', 'room_assets',
      'store_orders', 'store_customers', 'store_categories',
      'whatsapp_instances', 'whatsapp_contacts', 'whatsapp_messages',
      'evolution_instances', 'evolution_webhooks',
      'n8n_workflows', 'n8n_executions',
      'supabase_master_config', 'redis_config', 'sentry_config',
      'resend_config', 'cloudflare_config', 'better_stack_config',
      'bigdatacorp_config', 'cache_config', 'optimizer_config',
      'monitoring_config', 'hms_100ms_config', 'total_express_config',
      'pluggy_config', 'n8n_config', 'app_settings_backup',
      'tenant_migrations', 'migration_logs', 'schema_versions',
    ];
    
    console.log('Testando tabelas conhecidas...');
    for (const table of knownTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error || error.message.includes('0 rows')) {
        tables.push(table);
      }
    }
  }
  
  // Always include core tables
  const coreTables = [
    'dados_cliente', 'form_submissions_compliance_tracking', 'form_submissions',
    'cpf_compliance_results', 'reunioes', 'n8n_chat_histories', 'forms',
    'tenants_registry', 'app_settings', 'leads', 'store_products',
    'whatsapp_labels', 'reseller_configs', 'workspace_pages', 'workspace_boards',
  ];
  
  const finalTables = [...new Set([...coreTables, ...tables])];
  console.log(`\n✅ Total de tabelas encontradas: ${finalTables.length}`);
  console.log(finalTables.join(', '));
  
  // Save to file
  const fs = await import('fs');
  fs.writeFileSync('tables_157.json', JSON.stringify(finalTables, null, 2));
  console.log('✅ Salvo em tables_157.json');
  
  return finalTables;
}

generateTablesJson().catch(e => console.error('Error:', e.message));
