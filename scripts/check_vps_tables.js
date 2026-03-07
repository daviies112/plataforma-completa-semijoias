const { Client } = require('pg');
const connectionString = "postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable";

async function checkTables() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables found:', res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error('Error checking tables:', err);
    } finally {
        await client.end();
    }
}

checkTables();
