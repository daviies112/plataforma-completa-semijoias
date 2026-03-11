
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const { Client } = pg;

async function setupLocalSupabase() {
  const connectionString = 'postgresql://postgres:230723Davi%23b@103.199.187.145:5432/db_cliente_plataforma?sslmode=disable';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to platform database');

    const localUrl = process.env.SUPABASE_LOCAL_URL || 'http://103.199.187.145:8100';
    const localKey = process.env.SUPABASE_LOCAL_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwOTM5NjkwLCJleHAiOjIwODYyOTk2OTB9.wr0LSRqe7LmvQLp7z1sHrGolTBd8fVIc3LPZMg0fTTI';

    // Upsert local config
    const query = `
      INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (tenant_id) DO UPDATE 
      SET supabase_url = EXCLUDED.supabase_url,
          supabase_anon_key = EXCLUDED.supabase_anon_key,
          updated_at = NOW()
    `;

    // Note: tenant_id has no unique constraint in some schemas, but usually it's treated as one.
    // If there's no unique constraint, we'll check first.
    
    const checkUnique = await client.query("SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name='supabase_config' AND constraint_type='UNIQUE' OR constraint_type='PRIMARY KEY'");
    
    // Simplest: Delete and re-insert for 'local' to be sure
    await client.query("DELETE FROM supabase_config WHERE tenant_id = 'local'");
    await client.query("DELETE FROM supabase_config WHERE tenant_id = 'supabase_local'");
    
    await client.query(
      "INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket) VALUES ($1, $2, $3, $4)",
      ['local', localUrl, localKey, 'receipts']
    );
    
    await client.query(
      "INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket) VALUES ($1, $2, $3, $4)",
      ['supabase_local', localUrl, localKey, 'receipts']
    );

    console.log('✅ Local Supabase configured in database for tenants: local, supabase_local');

  } catch (error) {
    console.error('❌ Error configuring local Supabase:', error);
  } finally {
    await client.end();
  }
}

setupLocalSupabase();
