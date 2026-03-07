const { Client } = require('pg');

const connectionString = "postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable";

async function migrate() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database at 103.199.187.145');

    // 1. bigdatacorp_config
    await client.query(`
      CREATE TABLE IF NOT EXISTS bigdatacorp_config (
        id SERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL UNIQUE,
        token_id TEXT NOT NULL,
        chave_token TEXT NOT NULL,
        supabase_master_url TEXT,
        supabase_master_service_role_key TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table bigdatacorp_config verified/created.');

    // 2. datacorp_checks
    await client.query(`
      CREATE TABLE IF NOT EXISTS datacorp_checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cpf_hash TEXT NOT NULL,
        cpf_encrypted TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        lead_id UUID,
        submission_id UUID,
        person_name TEXT,
        person_cpf TEXT,
        status TEXT NOT NULL,
        risk_score NUMERIC(5,2),
        payload JSONB NOT NULL,
        consulted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        source TEXT DEFAULT 'bigdatacorp_v3_complete',
        api_cost NUMERIC(10,2) DEFAULT 0.17,
        created_by UUID,
        origin_check_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cpf_hash ON datacorp_checks(cpf_hash);
      CREATE INDEX IF NOT EXISTS idx_datacorp_tenant_id ON datacorp_checks(tenant_id);
    `);
    console.log('Table datacorp_checks verified/created.');

    // 3. integration_queue
    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_error TEXT,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Table integration_queue verified/created.');

    // 4. revendedoras
    await client.query(`
      CREATE TABLE IF NOT EXISTS revendedoras (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        email TEXT,
        telefone TEXT,
        status TEXT DEFAULT 'ativo',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Table revendedoras verified/created.');

    // 5. admin_supabase_credentials
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_supabase_credentials (
        id SERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL UNIQUE,
        supabase_url TEXT NOT NULL,
        supabase_service_role_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table admin_supabase_credentials verified/created.');

    console.log('All tables created successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
