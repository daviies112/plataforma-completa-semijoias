const https = require('https');
const bcrypt = require('bcryptjs');

const SB_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

function sbGet(path) {
  return new Promise((resolve) => {
    const url = new URL(path, SB_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ raw: data.substring(0, 200) }); }
      });
    }).on('error', e => resolve({ err: e.message }));
  });
}

async function main() {
  // 1. Test passwords
  console.log('\n=== SENHAS ===');
  const users = await sbGet('/rest/v1/admin_users?select=email,tenant_id,company_name,password_hash');
  const pwds = ['230723Davi#', '230723Davi#b', 'Admin123', 'davi123', 'emerick123', 'emericks123', 'nexus123', '12345678'];
  if (Array.isArray(users)) {
    for (const u of users) {
      let found = false;
      for (const p of pwds) {
        const ok = await bcrypt.compare(p, u.password_hash || '');
        if (ok) {
          console.log('  MATCH:', u.email, '| pwd:', p, '| tenant_id:', u.tenant_id);
          found = true;
        }
      }
      if (!found) console.log('  NO MATCH:', u.email, '| tenant_id:', u.tenant_id);
    }
  } else {
    console.log('  Erro:', JSON.stringify(users));
  }

  // 2. Count by tenant_id in critical tables
  console.log('\n=== DADOS POR TENANT_ID ===');
  const tables = [
    'dados_cliente', 'form_submissions', 'form_submissions_compliance_tracking',
    'reunioes', 'leads', 'store_products', 'store_settings',
    'resellers', 'formularios', 'formulario_envios',
    'cpf_compliance_resultados', 'n8n_chat_histories',
    'workspace_boards', 'workspace_pages'
  ];
  for (const t of tables) {
    const rows = await sbGet('/rest/v1/' + t + '?select=tenant_id&limit=500');
    if (rows.code === '42P01' || rows.message === '{}') continue;
    if (Array.isArray(rows) && rows.length === 0) {
      console.log('  ' + t + ': VAZIO');
      continue;
    }
    if (Array.isArray(rows)) {
      const c = {};
      rows.forEach(r => { const k = r.tenant_id || 'NULL'; c[k] = (c[k] || 0) + 1; });
      const s = Object.entries(c).sort((a, b) => b[1] - a[1]);
      console.log('  ' + t + ' (' + rows.length + '): ' + s.map(([k, v]) => k + ':' + v).join(' | '));
    } else {
      console.log('  ' + t + ': ' + JSON.stringify(rows).substring(0, 100));
    }
  }
}

main().catch(console.error);
