
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const r = await pool.query('SELECT id, email, tenant_id FROM users');
  r.rows.forEach(u => console.log('USER_IN_DB:', JSON.stringify(u)));
  await pool.end();
}
run().catch(console.error);
