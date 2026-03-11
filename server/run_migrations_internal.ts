import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This assumes running from the 'server' directory or project root
// We will use standard fetch/supabase approach or rely on the running pg connection
// Since Supabase JS client doesn't support executing arbitrary SQL, we need PG or an RPC.
// We will create a robust migration script using the "pg" module since it's already in the project.
import pkg from 'pg';
const { Client } = pkg;

async function run() {
  const connString = 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable';
  console.log("Using Connection String:", connString);

  const client = new Client({ connectionString: connString });
  
  try {
    await client.connect();
    console.log("Connected to DB");
    
    // We will read the scripts from the multitenant_id folder
    const folder = path.resolve('C:\\Users\\davie\\Downloads\\Skill e mcp\\multitenant_id');
    const files = [
      '01_tenant_foundation.sql',
      '02_reseller_dual_key.sql',
      '03_row_level_security.sql',
      '04_tenant_renamer.sql',
      '05_evolution_api_sync.sql'
    ];

    for (let f of files) {
       console.log(`Running: ${f}`);
       const content = fs.readFileSync(path.join(folder, f), 'utf-8');
       await client.query(content);
       console.log(`SUCCESS: ${f}`);
    }

  } catch(e) {
    console.error("Migration Failed:", e.message);
  } finally {
    try { await client.end(); } catch(e){}
  }
}

run();
