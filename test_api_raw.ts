import fetch from 'node-fetch';

async function test() {
  const url = 'http://localhost:5000/api/leads-pipeline/emerick';
  console.log(`📡 Fetching from ${url}...`);
  try {
    const res = await fetch(url);
    if (res.status === 202) {
      console.log('⏳ Server is aggregating data... (202)');
      return;
    }
    const data = await res.json();
    console.log('✅ Success:', data.success);
    console.log('📦 Total Leads:', data.data?.leads?.length);
    
    const davi = data.data?.leads?.find((l: any) => l.phone?.includes('3192267220') || (l.name && l.name.includes('Davi')));
    if (davi) {
      console.log(`👤 Davi Found! Name: "${davi.name}" || Phone: ${davi.phone} || Status: ${davi.pipelineStatus}`);
    } else {
      console.log('👤 Davi NOT found in the list.');
    }
  } catch (e: any) {
    console.error(`❌ Fetch failed: ${e.message}`);
  }
}

test();
