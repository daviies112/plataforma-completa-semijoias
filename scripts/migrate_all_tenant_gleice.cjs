const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/postgres?sslmode=disable',
  ssl: false
});

async function f() {
  const c = await pool.connect();
  const res = await c.query("SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public'");
  
  for (let row of res.rows) {
    try {
      const u = await c.query(`UPDATE "` + row.table_name + `" SET tenant_id = 'davisemi-joias' WHERE tenant_id = 'gleice'`);
      if (u.rowCount > 0) {
        console.log('Migrados ' + u.rowCount + ' registros na tabela: ' + row.table_name);
      }
    } catch(e) { console.log('Erro ' + row.table_name, e.message); }
  }
  
  // also update 'emericks' or 'emerick' test data just manually specifying tables to be safe with user intent? 
  // No, just gleice.

  console.log('Finalizado.');
  c.release();
  await pool.end();
}
f();
