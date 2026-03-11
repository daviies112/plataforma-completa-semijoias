
import pkg from 'pg';
const { Client } = pkg;

const sql = `
ALTER TABLE workspace_pages ADD COLUMN IF NOT EXISTS public_slug TEXT;
ALTER TABLE workspace_pages ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE workspace_databases ADD COLUMN IF NOT EXISTS public_slug TEXT;
ALTER TABLE workspace_databases ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE workspace_boards ADD COLUMN IF NOT EXISTS public_slug TEXT;
ALTER TABLE workspace_boards ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
`;

async function runMigration() {
  const connectionString = "postgresql://postgres:230723Davi%23b@103.199.187.145:5432/db_cliente_plataforma?sslmode=disable";
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('✅ Connected to db_cliente_plataforma');
    await client.query(sql);
    console.log('✅ Migration Success: Added public columns');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
