import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable'
});

async function main() {
  await client.connect();

  console.log("Fixing form_tenant_mapping...");
  // update the specific form ID 'ff98171b-645b-4122-b864-b6b8d66b2279' 
  // setting company_slug = 'emericks' and tenant_id = 'emerick' (which is the actual Supabase tenant_id)
  let resUpdate = await client.query(`
    UPDATE form_tenant_mapping 
    SET company_slug = 'emericks', tenant_id = 'emerick', is_public = true 
    WHERE form_id = 'ff98171b-645b-4122-b864-b6b8d66b2279' 
    RETURNING *
  `);
  console.log("Updated mappings:", resUpdate.rows);

  await client.end();
}

main().catch(console.error);
