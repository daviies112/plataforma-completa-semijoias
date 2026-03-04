import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres',
  ssl: false
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname LIKE 'workspace_%';
    `);
    console.log("RLS Status:", res.rows);
  } catch (err) {
    console.error("Error query:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
