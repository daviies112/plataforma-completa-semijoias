import { getClientSupabaseClientStrict } from './server/lib/multiTenantSupabase';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const supabase = await getClientSupabaseClientStrict('emerick');
    if (!supabase) {
      console.error('No supabase client');
      process.exit(1);
    }
    const { data, error } = await supabase.from('dados_cliente').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample:', data[0]);
    } else {
      console.log('No data');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
