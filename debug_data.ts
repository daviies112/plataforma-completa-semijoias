import { getClientSupabaseClientStrict } from './server/lib/multiTenantSupabase';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = await getClientSupabaseClientStrict('emerick');
  if(!supabase) return;
  
  const { data: fc } = await supabase.from('form_submissions_compliance_tracking').select('*');
  console.log('Form compliance:\n', JSON.stringify(fc, null, 2));
  
  const { data: dc } = await supabase.from('dados_cliente').select('telefone, telefone_normalizado');
  console.log('Dados cliente:\n', JSON.stringify(dc, null, 2));

  const { data: cr } = await supabase.from('cpf_compliance_results').select('telefone, cpf, name, person_name');
  console.log('CPF Results:\n', JSON.stringify(cr, null, 2));

  process.exit(0);
}
run();
