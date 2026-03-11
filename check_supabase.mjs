import { createClient } from '@supabase/supabase-js';
const s = createClient('https://semijoias-supabase.y98g1d.easypanel.host',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q',
  { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  // Confirm tenant data after migration
  const tables = ['forms', 'reunioes', 'leads', 'workspace_boards', 'workspace_pages'];
  for (const t of tables) {
    const { data, error } = await s.from(t).select('tenant_id');
    if (error) { console.log(`${t}: ERROR ${error.message}`); continue; }
    const counts = {};
    for (const r of (data||[])) { const k = r.tenant_id||'NULL'; counts[k]=(counts[k]||0)+1; }
    console.log(`${t}:`, JSON.stringify(counts));
  }

  // Check what leads the Kanban should show for emericks-tenant
  const { data: reunioes } = await s.from('reunioes').select('id, tenant_id, nome, status').eq('tenant_id', 'emericks-tenant');
  console.log('\nReunioes for emericks-tenant:', reunioes?.length || 0, 'rows');
  if (reunioes?.length) console.log('Sample:', JSON.stringify(reunioes[0]));

  const { data: forms } = await s.from('forms').select('id, tenant_id, nome').eq('tenant_id', 'emericks-tenant');
  console.log('Forms for emericks-tenant:', forms?.length || 0);

  // Check if dados_cliente exists at all in Supabase
  const { error: dcErr } = await s.from('dados_cliente').select('id').limit(1);
  console.log('\ndados_cliente in Supabase:', dcErr ? `MISSING (${dcErr.message})` : 'EXISTS');
  
  const { error: fsErr } = await s.from('form_submissions_compliance_tracking').select('id').limit(1);
  console.log('form_submissions_compliance_tracking in Supabase:', fsErr ? `MISSING (${fsErr.message})` : 'EXISTS');
}
run().catch(e => console.error(e.message));
