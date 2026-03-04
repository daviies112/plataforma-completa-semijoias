import pkg from 'pg';
const { Client } = pkg;

async function checkSchema() {
  const connectionString = "postgresql://postgres:230723Davi%23b@103.199.187.145:5432/db_cliente_plataforma?sslmode=disable";
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'resellers'");
    console.log('--- Columns in table resellers ---');
    res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkSchema();
