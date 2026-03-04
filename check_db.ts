import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const res = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'supabase_config'");
    console.log('Columns:', res.rows);
    const ind = await p.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'supabase_config'");
    console.log('Indexes:', ind.rows);
  } finally {
    await p.end();
  }
}
run();
