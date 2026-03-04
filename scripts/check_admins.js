
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function run() {
  const url = process.env.SUPABASE_LOCAL_URL;
  const key = process.env.SUPABASE_LOCAL_SERVICE_KEY;

  console.log('Testing Owner Supabase Connection...');
  console.log('URL:', url);
  
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from('admin_users').select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data.length} admin users:`);
    data.forEach(u => console.log(`- [${u.id}] ${u.email} (tenant: ${u.tenant_id})`));
  }
}

run();
