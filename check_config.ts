import { pool } from './server/db';

async function run() {
  const res = await pool.query("SELECT * FROM supabase_config WHERE tenant_id = 'emerick'");
  console.log('Config for emerick:\n', JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
