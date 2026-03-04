const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable' });
  await client.connect();
  
  const tables = [
    'dados_cliente',
    'form_submissions_compliance_tracking',
    'form_submissions',
    'cpf_compliance_results',
    'reunioes',
    'clientes_completos'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Updating ${table}...`);
      const res = await client.query(`UPDATE ${table} SET tenant_id = 'emerick' WHERE tenant_id IS NULL OR tenant_id != 'emerick'`);
      console.log(`- Updated ${res.rowCount} rows in ${table}`);
    } catch (err) {
      console.log(`- Error updating ${table}: ${err.message}`);
    }
  }
  await client.end();
}
run();
