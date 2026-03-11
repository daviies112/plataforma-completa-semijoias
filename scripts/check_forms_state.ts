
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;
console.log('Connecting to:', databaseUrl);

const client = new pg.Client({ connectionString: databaseUrl });

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const tables = ['tenants_registry', 'wallets', 'form_tenant_mapping', 'forms', 'app_settings'];
    for (const table of tables) {
      console.log(`\n--- Table: ${table} ---`);
      try {
        const res = await client.query(`SELECT count(*) FROM "${table}"`);
        console.log(`Row count: ${res.rows[0].count}`);
        
        if (res.rows[0].count > 0) {
          const sample = await client.query(`SELECT * FROM "${table}" LIMIT 5`);
          console.table(sample.rows);
        }
      } catch (e) {
        console.error(`❌ Error querying table ${table}:`, e.message);
      }
    }

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

main();
