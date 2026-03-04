import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('🔍 Verificando supabase_config existente...');
  
  // First check what columns exist
  const { data: existing, error: existErr } = await supabase
    .from('supabase_config')
    .select('*')
    .limit(10);
  
  if (existErr) {
    console.log('❌ Erro ao ler supabase_config:', existErr.message);
    return;
  }
  
  console.log('📋 Registros existentes:', JSON.stringify(existing?.map(r => ({
    id: r.id,
    tenant_id: r.tenant_id,
    has_url: !!r.supabase_url,
    has_key: !!r.supabase_anon_key,
    columns: Object.keys(r)
  }))));

  // Check if emerick already exists
  const emerickExists = existing?.find(r => r.tenant_id === 'emerick');
  
  if (emerickExists) {
    console.log('✅ emerick já existe na supabase_config! id:', emerickExists.id);
    console.log('URL:', emerickExists.supabase_url);
    // Update it to make sure it has the right values
    const { error: upErr } = await supabase
      .from('supabase_config')
      .update({
        supabase_url: SUPABASE_URL,
        supabase_anon_key: ANON_KEY,
        supabase_service_role_key: SERVICE_KEY,
      })
      .eq('tenant_id', 'emerick');
    if (upErr) console.log('❌ Erro ao atualizar:', upErr.message);
    else console.log('✅ emerick atualizado!');
  } else {
    console.log('⚠️  emerick NÃO existe. Criando...');
    // Check what columns the table actually has
    const cols = Object.keys(existing?.[0] || {});
    console.log('Colunas disponíveis:', cols);
    
    // Try to insert with all columns we know about
    const insertData: Record<string, any> = {
      tenant_id: 'emerick',
    };
    
    if (cols.includes('supabase_url')) insertData.supabase_url = SUPABASE_URL;
    if (cols.includes('url')) insertData.url = SUPABASE_URL;
    if (cols.includes('supabase_anon_key')) insertData.supabase_anon_key = ANON_KEY;
    if (cols.includes('anon_key')) insertData.anon_key = ANON_KEY;
    if (cols.includes('supabase_service_role_key')) insertData.supabase_service_role_key = SERVICE_KEY;
    if (cols.includes('service_role_key')) insertData.service_role_key = SERVICE_KEY;
    if (cols.includes('supabase_bucket')) insertData.supabase_bucket = 'semijoias';
    if (cols.includes('bucket')) insertData.bucket = 'semijoias';
    
    console.log('Inserindo:', JSON.stringify(Object.keys(insertData)));
    
    const { data: inserted, error: insErr } = await supabase
      .from('supabase_config')
      .insert(insertData)
      .select();
    
    if (insErr) {
      console.log('❌ Erro ao inserir emerick:', insErr.message, insErr.details);
      console.log('Hint:', insErr.hint);
    } else {
      console.log('✅ emerick criado com sucesso!', JSON.stringify(inserted));
    }
  }
  
  // Now force all tenant_ids to emerick in all tables
  console.log('\n🔄 Forçando tenant_id=emerick em todas as tabelas...');
  
  const tables = ['dados_cliente', 'form_submissions_compliance_tracking', 'cpf_compliance_results'];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .update({ tenant_id: 'emerick' })
      .or('tenant_id.is.null,tenant_id.neq.emerick');
    if (error) console.log(`❌ [${table}]:`, error.message);
    else console.log(`✅ [${table}] atualizado para emerick`);
  }
  
  console.log('\n✅ CONCLUÍDO! Reinicie o servidor e recarregue o Kanban.');
}

main().catch(e => console.error('FATAL:', e.message));
