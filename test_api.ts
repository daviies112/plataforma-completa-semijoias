import fetch from 'node-fetch';

async function test() {
  const url = 'http://localhost:5000/api/leads-pipeline/emerick';
  console.log(`📡 Fetching from ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
        console.error(`❌ HTTP Error: ${res.status}`);
        const text = await res.text();
        console.error(`Response: ${text.substring(0, 200)}`);
        return;
    }
    const data: any = await res.json();
    console.log(`✅ Received ${Array.isArray(data) ? data.length : 'non-array'} leads`);
    if (Array.isArray(data)) {
        const davi = data.find((l: any) => l.nome?.includes('Davi') || l.telefone?.includes('92267220'));
        console.log('👤 Davi Lead:', davi ? JSON.stringify({ nome: davi.nome, status: davi.pipelineStatus, phone: davi.telefone }, null, 2) : 'Not found');
        
        console.log('📋 Sample Statuses (Top 5):');
        data.slice(0, 5).forEach((l: any) => console.log(` - ${l.nome || 'No Name'}: ${l.pipelineStatus}`));
    }
  } catch (e: any) {
    console.error(`❌ Fetch failed: ${e.message}`);
  }
}

test();
