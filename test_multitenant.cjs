const http = require('http');

const BASE_HOST = 'localhost';
const BASE_PORT = 5000;

function request(method, path, body = null, token = null, cookie = null) {
  return new Promise((resolve) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (cookie) headers['Cookie'] = cookie;

    const opts = {
      hostname: BASE_HOST,
      port: BASE_PORT,
      path,
      method,
      headers
    };

    const req = http.request(opts, res => {
      let d = '';
      const cookies = res.headers['set-cookie'] || [];
      res.on('data', c => d += c);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(d); } catch(e) { parsed = { raw: d.substring(0, 300) }; }
        resolve({ status: res.statusCode, data: parsed, cookies });
      });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function extractCookie(cookies) {
  return cookies.map(c => c.split(';')[0]).join('; ');
}

async function testTenant(email, password, label) {
  console.log(`\n${'='.repeat(65)}`);
  console.log(`TENANT: ${label} | ${email}`);
  console.log('='.repeat(65));

  // 1. Login
  const login = await request('POST', '/api/auth/login', { email, senha: password });
  if (login.status !== 200) {
    console.log(`[LOGIN] FALHOU (${login.status}): ${JSON.stringify(login.data).substring(0, 200)}`);
    return null;
  }
  const token = login.data.token;
  const cookie = extractCookie(login.cookies);
  // Parse JWT payload (no verification needed for test)
  let tenantId;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    tenantId = payload.tenantId || payload.clientId;
  } catch(e) { tenantId = 'unknown'; }
  console.log(`[LOGIN] OK - tenantId: ${tenantId}`);

  // 2. Pipeline/Kanban — uses /:tenantId param
  const pipeline = await request('GET', `/api/leads-pipeline/${tenantId}`, null, token, cookie);
  console.log(`\n[PIPELINE/KANBAN] Status: ${pipeline.status}`);
  if (pipeline.status === 200) {
    const leads = pipeline.data?.data?.leads || [];
    const isLoading = pipeline.data?.data?.status === 'loading';
    if (isLoading) {
      console.log(`  ⏳ Carregando dados (202)...`);
    } else {
      console.log(`  Total leads: ${leads.length}`);
      if (leads.length > 0) {
        const stages = {};
        leads.forEach(l => { const s = l.pipelineStatus || l.calculatedStage || 'unknown'; stages[s] = (stages[s]||0)+1; });
        Object.entries(stages).forEach(([s,c]) => console.log(`    Stage "${s}": ${c} lead(s)`));
        console.log(`  Amostra: ${leads[0].nome || leads[0].name} | tenant: ${leads[0].tenantId}`);
      } else {
        console.log(`  ⚠️  VAZIO! Verificar dados no Supabase para tenant "${tenantId}"`);
      }
    }
  } else if (pipeline.status === 202) {
    console.log(`  ⏳ 202 - Dados sendo carregados. Tentando novamente...`);
    await new Promise(r => setTimeout(r, 3000));
    const pipeline2 = await request('GET', `/api/leads-pipeline/${tenantId}`, null, token, cookie);
    const leads2 = pipeline2.data?.data?.leads || [];
    console.log(`  Retry: ${leads2.length} leads`);
    leads2.forEach(l => console.log(`    - ${l.nome || l.name} | ${l.pipelineStatus}`));
  } else {
    console.log(`  ERROR: ${JSON.stringify(pipeline.data).substring(0, 200)}`);
  }

  // 3. Dashboard
  const dash = await request('GET', '/api/dashboard/dashboard-data', null, token, cookie);
  console.log(`\n[DASHBOARD] Status: ${dash.status}`);
  if (dash.status === 200) {
    const d = dash.data;
    console.log(`  leads total: ${d?.totalLeads ?? d?.data?.totalLeads ?? 'n/a'}`);
    console.log(`  meetings: ${d?.totalMeetings ?? d?.data?.totalMeetings ?? 'n/a'}`);
    console.log(`  tenant_id in data: ${d?.tenantId ?? d?.data?.tenantId ?? 'n/a'}`);
  } else {
    console.log(`  ${JSON.stringify(dash.data).substring(0, 150)}`);
  }

  // 4. Workspace boards
  const ws = await request('GET', '/api/workspace/boards', null, token, cookie);
  console.log(`\n[WORKSPACE BOARDS] Status: ${ws.status}`);
  if (ws.status === 200) {
    const boards = ws.data?.boards || ws.data?.data || ws.data || [];
    const arr = Array.isArray(boards) ? boards : [];
    console.log(`  Boards: ${arr.length}`);
    arr.forEach(b => console.log(`    - ${b.name || b.title} | tenant: ${b.tenant_id || b.tenantId}`));
  } else {
    console.log(`  ${JSON.stringify(ws.data).substring(0, 150)}`);
  }

  // 5. Workspace pages
  const pages = await request('GET', '/api/workspace/pages', null, token, cookie);
  console.log(`\n[WORKSPACE PAGES] Status: ${pages.status}`);
  if (pages.status === 200) {
    const arr = Array.isArray(pages.data) ? pages.data : (pages.data?.pages || pages.data?.data || []);
    console.log(`  Pages: ${Array.isArray(arr) ? arr.length : JSON.stringify(arr).substring(0,80)}`);
    if (Array.isArray(arr)) arr.forEach(p => console.log(`    - ${p.title || p.name} | tenant: ${p.tenant_id || p.tenantId}`));
  } else {
    console.log(`  ${JSON.stringify(pages.data).substring(0, 150)}`);
  }

  // 6. Meetings
  const meetings = await request('GET', '/api/reunioes', null, token, cookie);
  console.log(`\n[REUNIOES] Status: ${meetings.status}`);
  if (meetings.status === 200) {
    const arr = Array.isArray(meetings.data) ? meetings.data : (meetings.data?.data || meetings.data?.meetings || []);
    console.log(`  Count: ${Array.isArray(arr) ? arr.length : JSON.stringify(arr).substring(0,80)}`);
    if (Array.isArray(arr) && arr.length > 0) console.log(`  Amostra: ${arr[0].nome_lead || arr[0].nome} | tenant: ${arr[0].tenant_id}`);
  } else {
    console.log(`  ${JSON.stringify(meetings.data).substring(0, 150)}`);
  }

  // 7. Config
  const configRoutes = ['/api/config/company', '/api/config', '/api/settings'];
  for (const cr of configRoutes) {
    const cfg = await request('GET', cr, null, token, cookie);
    if (cfg.status === 200) {
      console.log(`\n[CONFIG @ ${cr}] OK - company: ${cfg.data?.companyName || cfg.data?.company_name || JSON.stringify(cfg.data).substring(0,80)}`);
      break;
    }
  }

  // 8. Pipeline debug
  const debug = await request('GET', `/api/leads-pipeline/debug/${tenantId}`, null, token, cookie);
  console.log(`\n[PIPELINE DEBUG] Status: ${debug.status}`);
  if (debug.status === 200) {
    console.log(`  supabaseUrl: ${debug.data?.supabaseUrl}`);
    const tables = debug.data?.tables || {};
    Object.entries(tables).forEach(([t, d]) => {
      console.log(`  ${t}: count=${d.count}, error=${d.error || 'none'}`);
    });
  } else {
    console.log(`  ${JSON.stringify(debug.data).substring(0, 150)}`);
  }

  return { tenantId, token, cookie };
}

async function main() {
  console.log('============================================================');
  console.log('MULTI-TENANT ISOLATION TEST SUITE');
  console.log('============================================================');

  const t1 = await testTenant('contato@emericks.com.br', '230723Davi#', 'Emericks (emericks-tenant)');
  const t2 = await testTenant('daviemericko@gmail.com', '230723Davi#', 'Davisemi Joias (davisemijoias)');

  // ISOLATION TEST
  if (t1 && t2) {
    console.log(`\n${'='.repeat(65)}`);
    console.log('ISOLATION TEST: Tenant1 tentando acessar dados do Tenant2');
    console.log('='.repeat(65));
    const attempt = await request('GET', `/api/leads-pipeline/${t2.tenantId}`, null, t1.token, t1.cookie);
    if (attempt.status === 403) {
      console.log(`✅ ISOLATION OK: Tenant1 bloqueado ao acessar Tenant2 (403)`);
    } else {
      console.log(`⚠️  FALHA DE ISOLAMENTO! Status: ${attempt.status} - ${JSON.stringify(attempt.data).substring(0,150)}`);
    }
  }

  console.log('\n');
}

main().catch(console.error);
