import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // Show ALL data in each Kanban table
  console.log('\n=== 1. DADOS_CLIENTE (Contato Inicial) ===');
  const { data: dc, error: dce } = await sb.from('dados_cliente').select('*').eq('tenant_id', 'emerick');
  if (dce) console.log('ERROR:', dce.message);
  else console.log(`${dc?.length} rows:`, JSON.stringify(dc?.map(r => ({ id: r.id, name: r['NomeWpp'] || r.nome, phone: r.telefone, status: r.reuniao_status }))));

  console.log('\n=== 2. FORM_SUBMISSIONS_COMPLIANCE_TRACKING (Formulário Não Preenchido) ===');
  const { data: fct, error: fcte } = await sb.from('form_submissions_compliance_tracking').select('*').eq('tenant_id', 'emerick');
  if (fcte) console.log('ERROR:', fcte.message);
  else console.log(`${fct?.length} rows:`, JSON.stringify(fct?.map(r => ({ id: r.id, nome: r.nome, telefone: r.telefone, tipo: r.tipo }))));

  console.log('\n=== 3. FORM_SUBMISSIONS (Aprovado/Reprovado) ===');
  const { data: fs, error: fse } = await sb.from('form_submissions').select('*').eq('tenant_id', 'emerick');
  if (fse) console.log('ERROR:', fse.message);
  else console.log(`${fs?.length} rows:`, JSON.stringify(fs?.map(r => ({ id: r.id, name: r.contact_name, phone: r.contact_phone, passed: r.passed }))));

  console.log('\n=== 4. CPF_COMPLIANCE_RESULTS (CPF Aprovado/Reprovado) ===');
  const { data: cpf, error: cpfe } = await sb.from('cpf_compliance_results').select('*').eq('tenant_id', 'emerick');
  if (cpfe) console.log('ERROR:', cpfe.message);
  else console.log(`${cpf?.length} rows:`, JSON.stringify(cpf?.map(r => ({ id: r.id, nome: r.nome, telefone: r.telefone, status: r.status, aprovado: r.aprovado }))));

  console.log('\n=== 5. REUNIOES (Reunião Agendada/Não Compareceu/Completa) ===');
  const { data: re, error: ree } = await sb.from('reunioes').select('*').eq('tenant_id', 'emerick');
  if (ree) console.log('ERROR:', ree.message);
  else console.log(`${re?.length} rows:`, JSON.stringify(re?.map(r => ({ id: r.id, status: r.status, titulo: r.titulo }))));
}

main().catch(e => console.error('FATAL:', e.message));
