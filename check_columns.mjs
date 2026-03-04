import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres',
  ssl: false
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('workspace_boards', 'workspace_databases')
      ORDER BY table_name;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error query:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
