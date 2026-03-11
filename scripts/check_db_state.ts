
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

    const tables = ['tenants_registry', 'wallets', 'compliance_users'];
    for (const table of tables) {
      console.log(`\n--- Table: ${table} ---`);
      try {
        const res = await client.query(`SELECT count(*) FROM "${table}"`);
        console.log(`Row count: ${res.rows[0].count}`);
        
        const schema = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [table]);
        schema.rows.forEach(row => console.log(` - ${row.column_name}: ${row.data_type} (Nullable: ${row.is_nullable})`));

        if (res.rows[0].count > 0) {
          const sample = await client.query(`SELECT * FROM "${table}" LIMIT 1`);
          console.log('Sample row:', sample.rows[0]);
        }
      } catch (e) {
        console.error(`❌ Error querying table ${table}:`, e.message);
      }
    }

    // Check foreign keys
    console.log('\n--- Foreign Keys ---');
    const fks = await client.query(`
      SELECT
          tc.table_name, kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY';
    `);
    fks.rows.forEach(row => {
      console.log(` - ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

main();
