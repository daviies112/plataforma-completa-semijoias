const { Client } = require('pg');
const https = require('https');
const bcrypt = require('bcryptjs');

const VALID_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const VALID_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const VALID_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

function sbPatch(path, body) {
  return new Promise((resolve) => {
    const url = new URL(path, VALID_URL);
    const data = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PATCH',
      headers: {
        apikey: VALID_SERVICE_KEY,
        Authorization: 'Bearer ' + VALID_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        Prefer: 'return=representation'
      }
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d.substring(0, 200) }); } });
    });
    req.on('error', e => resolve({ err: e.message }));
    req.write(data);
    req.end();
  });
}

async function main() {
  // Fix 1: Fix supabase_config id=3 (corrupted URL for 'emericks')
  const pg = new Client({
    host: '103.199.187.145', port: 5432, database: 'semijoias',
    user: 'postgres', password: '230723Davi#', ssl: false
  });
  await pg.connect();

  console.log('=== FIX 1: supabase_config id=3 (emericks) - corrigindo URL corrompida ===');
  const fix1 = await pg.query(
    `UPDATE supabase_config SET supabase_url=$1, supabase_anon_key=$2
     WHERE id=3 AND tenant_id='emericks'`,
    [VALID_URL, VALID_KEY]
  );
  console.log('  Rows affected:', fix1.rowCount);

  console.log('\n=== FIX 2: Ensure supabase_config has all lowercase tenant variants ===');
  const existing = await pg.query('SELECT id, tenant_id FROM supabase_config ORDER BY id');
  console.log('  Existing tenant_ids:', existing.rows.map(r => r.tenant_id).join(', '));
  // Check if 'davisemijoias' (lowercase, no dash) exists
  const hasDavi = existing.rows.some(r => r.tenant_id === 'davisemijoias');
  if (!hasDavi) {
    console.log('  Adding davisemijoias row...');
    await pg.query(
      `INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key)
       VALUES ('davisemijoias', $1, $2)`,
      [VALID_URL, VALID_KEY]
    );
    console.log('  Added davisemijoias row');
  } else {
    console.log('  davisemijoias row already exists');
  }

  await pg.end();

  // Fix 3: Reset contato@emericks.com.br password to 230723Davi#
  console.log('\n=== FIX 3: Reset contato@emericks.com.br password ===');
  const newHash = await bcrypt.hash('230723Davi#', 12);
  const result = await sbPatch(
    '/rest/v1/admin_users?email=eq.contato%40emericks.com.br',
    { password_hash: newHash }
  );
  console.log('  Result:', JSON.stringify(result).substring(0, 200));

  // Fix 4: Normalize admin_users tenant_ids to lowercase
  console.log('\n=== FIX 4: Normalize admin_users.tenant_id to lowercase in Supabase ===');
  // Davisemijoias -> davisemijoias
  const fix4 = await sbPatch(
    '/rest/v1/admin_users?email=eq.daviemericko%40gmail.com',
    { tenant_id: 'davisemijoias' }
  );
  console.log('  daviemericko@gmail.com tenant_id fix:', JSON.stringify(fix4).substring(0, 150));

  console.log('\nAll fixes applied!');
}

main().catch(console.error);
