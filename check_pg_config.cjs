const { Client } = require('pg');

const pg = new Client({
  host: '103.199.187.145',
  port: 5432,
  database: 'semijoias',
  user: 'postgres',
  password: '230723Davi#',
  ssl: false
});

async function main() {
  await pg.connect();
  console.log('=== supabase_config ===');
  const res1 = await pg.query('SELECT id, tenant_id, supabase_url, LEFT(supabase_anon_key,30) as anon_key_prefix FROM supabase_config ORDER BY id');
  res1.rows.forEach(r => console.log(JSON.stringify(r)));

  console.log('\n=== app_settings ===');
  const res2 = await pg.query('SELECT id, tenant_id, company_name FROM app_settings ORDER BY id LIMIT 20');
  res2.rows.forEach(r => console.log(JSON.stringify(r)));

  console.log('\n=== admin_users (local postgres) ===');
  try {
    const res3 = await pg.query('SELECT id, email, tenant_id FROM admin_users ORDER BY id LIMIT 20');
    res3.rows.forEach(r => console.log(JSON.stringify(r)));
  } catch(e) { console.log('  No admin_users table:', e.message); }

  await pg.end();
}

main().catch(console.error);
