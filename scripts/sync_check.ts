
import 'dotenv/config';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const postgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_LOCAL_URL || 'postgresql://postgres:230723Davi%23@103.199.191.139:5432/postgres';
const supabaseUrl = process.env.SUPABASE_LOCAL_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_LOCAL_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkFormContent() {
  const formId = '0a3514bb-75cc-47cf-81cd-7994724b126d';
  console.log(`🔍 Checking form content for ID: ${formId}`);

  // 1. Local Postgres
  const client = new pg.Client({ connectionString: postgresUrl });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM forms WHERE id = $1', [formId]);
    console.log('\n--- LOCAL POSTGRES ---');
    if (res.rows.length > 0) {
      const row = res.rows[0];
      console.log('Title:', row.title);
      console.log('Description:', row.description);
      console.log('is_public:', row.is_public);
      console.log('design_config:', JSON.stringify(row.design_config || row.designConfig, null, 2));
    } else {
      console.log('Form not found in local Postgres');
    }
  } catch (e: any) {
    console.error('Error connecting to local Postgres:', e.message);
  } finally {
    await client.end();
  }

  // 2. Supabase
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      console.log('\n--- SUPABASE ---');
      if (data) {
        console.log('Title:', data.title);
        console.log('Description:', data.description);
        console.log('is_public:', data.is_public);
        console.log('design_config:', JSON.stringify(data.design_config, null, 2));
      } else {
        console.log('Form not found in Supabase or error:', error?.message);
      }
    } catch (e: any) {
      console.error('Error connecting to Supabase:', e.message);
    }
  } else {
    console.log('Supabase config missing');
  }

  // 3. Check form_tenant_mapping for slug "gabriel"
  const client2 = new pg.Client({ connectionString: postgresUrl });
  try {
    await client2.connect();
    const res = await client2.query('SELECT * FROM form_tenant_mapping WHERE slug = $1', ['gabriel']);
    console.log('\n--- FORM_TENANT_MAPPING (Local) ---');
    console.table(res.rows);
  } catch (e: any) {
    console.error('Error checking mapping in local Postgres:', e.message);
  } finally {
    await client2.end();
  }
}

checkFormContent();
