
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;
const client = new pg.Client({ connectionString: databaseUrl });

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const tenants = [
      { slug: 'system', name: 'Sistema Central' },
      { slug: 'emericks-tenant', name: 'Emerick Store' }
    ];

    for (const tenant of tenants) {
      console.log(`Checking tenant: ${tenant.slug}`);
      const check = await client.query('SELECT id FROM tenants_registry WHERE slug = $1', [tenant.slug]);
      
      if (check.rows.length === 0) {
        console.log(`Inserting tenant: ${tenant.slug}`);
        await client.query('INSERT INTO tenants_registry (slug, company_name, is_active) VALUES ($1, $2, true)', [tenant.slug, tenant.name]);
        console.log(`✅ Tenant ${tenant.slug} inserted`);
      } else {
        console.log(`ℹ️ Tenant ${tenant.slug} already exists (ID: ${check.rows[0].id})`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
