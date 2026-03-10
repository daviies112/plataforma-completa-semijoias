
const { Pool } = require('pg');

async function testConnection() {
  const connectionStrings = [
    "postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable",
    "postgresql://postgres:230723Davi%23b@103.199.187.145:5432/semijoias?sslmode=disable",
    "postgresql://postgres:230723Davi%23@103.199.187.145:5432/plataforma?sslmode=disable",
    "postgresql://postgres:230723Davi%23b@103.199.187.145:5432/plataforma?sslmode=disable"
  ];

  for (const connStr of connectionStrings) {
    console.log(`Testing connection string...`);
    const pool = new Pool({ 
      connectionString: connStr, 
      connectionTimeoutMillis: 10000,
      ssl: false
    });
    try {
      const res = await pool.query('SELECT 1 as connected');
      console.log('✅ SUCCESS for string:', connStr.replace(/:[^:]*@/, ':****@').replace(/\?.*/, ''));
      console.log('Result:', res.rows[0]);
      await pool.end();
      return;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
    } finally {
      await pool.end();
    }
  }
}

testConnection().catch(console.error);
