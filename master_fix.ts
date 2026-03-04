import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAllTenants() {
  const tables = [
    'dados_cliente',
    'form_submissions',
    'form_submissions_compliance_tracking',
    'cpf_compliance_results',
    'reunioes',
    'reuniao'
  ];

  console.log('🚀 Starting Master Tenant Sync to emerick...');

  for (const table of tables) {
    console.log(`📡 Updating ${table}...`);
    const { data, error, count } = await supabase
      .from(table)
      .update({ tenant_id: 'emerick' })
      .neq('tenant_id', 'emerick');
    
    if (error) {
      console.error(`❌ Error updating ${table}:`, error.message);
    } else {
      console.log(`✅ ${table} updated (if any records were non-emerick)`);
    }
  }

  // Debug Davi Lead
  console.log('\n🔍 Debugging Davi Lead (553192267220@s.whatsapp.net)...');
  const { data: davi, error: daviErr } = await supabase
    .from('dados_cliente')
    .select('*')
    .or('telefone.eq.553192267220@s.whatsapp.net,telefone_normalizado.eq.+5531992267220')
    .single();

  if (davi) {
    console.log('👤 Davi record keys:', Object.keys(davi).join(', '));
    console.log('👤 Davi data:', JSON.stringify(davi, null, 2));
  } else {
    console.log('❌ Davi not found or multiple records found.');
  }
}

fixAllTenants();
