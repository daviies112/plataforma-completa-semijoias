
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/var/www/plataformacompleta/.env' });

const supabaseOwner = createClient(
  process.env.SUPABASE_LOCAL_URL,
  process.env.SUPABASE_LOCAL_KEY
);

async function test() {
   const email = 'contato@emericks.com.br';
   const result = await supabaseOwner.from("admin_users").select("*").eq("email", email).single();
   console.log('Result:', result.data);
   console.log('Error:', result.error);
}
test();

