import pkg from 'pg';
const { Pool } = pkg;
const p = new Pool({ connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable' });

async function run() {
  try {
    // Check what tenant_id the admin_users table has (actual login data)
    const tables = await p.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    const tableNames = tables.rows.map(r => r.table_name);
    console.log('LOCAL_TABLES:' + JSON.stringify(tableNames));

    // Check supabase_config rows carefully
    const sc = await p.query('SELECT id, tenant_id, supabase_url, supabase_anon_key FROM supabase_config');
    console.log('SUPABASE_CONFIG:' + JSON.stringify(sc.rows.map(r => ({
      id: r.id,
      tenant_id: r.tenant_id,
      url: r.supabase_url?.substring(0, 50),
      key_starts: r.supabase_anon_key?.substring(0, 30)
    }))));

    // Check app_settings
    const as = await p.query('SELECT * FROM app_settings LIMIT 5');
    console.log('APP_SETTINGS:' + JSON.stringify(as.rows));
  } catch (e) {
    console.error('DB_ERROR:' + e.message);
  } finally {
    await p.end();
  }
}
run();
