import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // 1. MAIS IMPORTANTE: supabase_config (controla o acesso multi-tenant)
  console.log('\n=== 1. SUPABASE_CONFIG (CRÍTICO) ===');
  const { data: cfg, error: cfgErr } = await supabase.from('supabase_config').select('*').limit(20);
  if (cfgErr) console.log('ERRO supabase_config:', cfgErr.message);
  else {
    console.log('Rows:', cfg?.length);
    cfg?.forEach(r => console.log('  tenant:', r.tenant_id, '| url:', (r.url||'').substring(0,40), '| cols:', Object.keys(r).join(',')));
  }

  // 2. dados_cliente - quantos registros e quais tenant_ids
  console.log('\n=== 2. DADOS_CLIENTE ===');
  const { data: dc } = await supabase.from('dados_cliente').select('tenant_id');
  const dcByTenant: Record<string, number> = {};
  dc?.forEach((r:any) => { const t = r.tenant_id||'NULL'; dcByTenant[t] = (dcByTenant[t]||0)+1; });
  console.log('Por tenant:', JSON.stringify(dcByTenant));

  // 3. form_submissions_compliance_tracking
  console.log('\n=== 3. FORM_SUBMISSIONS_COMPLIANCE_TRACKING ===');
  const { data: fct, error: fctErr } = await supabase.from('form_submissions_compliance_tracking').select('tenant_id');
  if (fctErr) console.log('ERRO:', fctErr.message);
  else {
    const byT: Record<string, number> = {};
    fct?.forEach((r:any) => { const t = r.tenant_id||'NULL'; byT[t] = (byT[t]||0)+1; });
    console.log('Por tenant:', JSON.stringify(byT), '| Total:', fct?.length);
  }

  // 4. form_submissions
  console.log('\n=== 4. FORM_SUBMISSIONS ===');
  const { data: fs, error: fsErr } = await supabase.from('form_submissions').select('tenant_id');
  if (fsErr) console.log('ERRO:', fsErr.message);
  else {
    const byT: Record<string, number> = {};
    fs?.forEach((r:any) => { const t = r.tenant_id||'NULL'; byT[t] = (byT[t]||0)+1; });
    console.log('Por tenant:', JSON.stringify(byT), '| Total:', fs?.length);
  }

  // 5. cpf_compliance_results
  console.log('\n=== 5. CPF_COMPLIANCE_RESULTS ===');
  const { data: cpf, error: cpfErr } = await supabase.from('cpf_compliance_results').select('tenant_id');
  if (cpfErr) console.log('ERRO:', cpfErr.message);
  else {
    const byT: Record<string, number> = {};
    cpf?.forEach((r:any) => { const t = r.tenant_id||'NULL'; byT[t] = (byT[t]||0)+1; });
    console.log('Por tenant:', JSON.stringify(byT), '| Total:', cpf?.length);
  }

  // 6. reunioes
  console.log('\n=== 6. REUNIOES ===');
  const { data: re, error: reErr } = await supabase.from('reunioes').select('tenant_id,status');
  if (reErr) console.log('ERRO:', reErr.message);
  else {
    const byT: Record<string, number> = {};
    re?.forEach((r:any) => { const t = r.tenant_id||'NULL'; byT[t] = (byT[t]||0)+1; });
    console.log('Por tenant:', JSON.stringify(byT), '| Total:', re?.length);
  }
}

main().catch(e => console.error('FATAL:', e.message));
