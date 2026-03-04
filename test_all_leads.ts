import fetch from 'node-fetch';

async function main() {
  // Force refresh to bypass cache
  const res = await fetch('http://localhost:5000/api/leads-pipeline/emerick?refresh=true&page=0&limit=50');
  const data = await res.json() as any;
  
  console.log('Status:', res.status);
  console.log('Success:', data.success);
  console.log('Source:', data.source || data.data?.source);
  console.log('Total Leads:', data.totalLeads || data.leads?.length || data.data?.leads?.length || 0);
  
  const leads = data.leads || data.data?.leads || [];
  console.log('\n=== ALL LEADS ===');
  for (const l of leads) {
    console.log(`  [${l.pipelineStatus}] ${l.nome} | ${l.telefone} | origem: ${l.origem}`);
  }
  
  console.log('\n=== STAGE COUNTS ===');
  const stages: Record<string, number> = {};
  for (const l of leads) stages[l.pipelineStatus] = (stages[l.pipelineStatus] || 0) + 1;
  console.log(JSON.stringify(stages, null, 2));
}

main().catch(e => console.error('ERRO:', e.message));
