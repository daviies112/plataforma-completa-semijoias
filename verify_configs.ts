import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const databaseUrl = process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_ANON_KEY}@db.${process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]}.supabase.co:5432/postgres`;
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query("SELECT tenant_id, supabase_url FROM supabase_config");
    console.log('Configs found:', res.rows);
  } catch (err) {
    console.error('Error querying supabase_config:', err.message);
  } finally {
    await pool.end();
  }
}
run();
