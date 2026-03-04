import pkg from 'pg';
const { Client } = pkg;

async function checkDB() {
  const connectionString = "postgresql://postgres:230723Davi%23b@103.199.187.145:5432/db_cliente_plataforma?sslmode=disable";
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('--- Tables in db_cliente_plataforma ---');
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkDB();
