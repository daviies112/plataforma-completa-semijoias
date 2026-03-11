import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

// URL of the Supabase postgres instance
const pool = new Pool({ connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/postgres?sslmode=disable' });

async function run() {
  const c = await pool.connect();
  console.log("Connectado ao Supabase.");
  for (let t of ['dados_cliente', 'form_submissions', 'leads']) {
    try {
      const res = await c.query(`SELECT tenant_id, COUNT(*) FROM "${t}" GROUP BY tenant_id`);
      console.log(`\nTabela: ${t}`);
      console.dir(res.rows);
    } catch(e) { console.log(e.message); }
  }
  c.release();
  await pool.end();
}
run();
