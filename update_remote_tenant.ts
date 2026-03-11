import { getClientSupabaseClientStrict } from './server/lib/multiTenantSupabase';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const tenantId = 'emerick';
  console.log(`Getting Supabase client for tenant: ${tenantId}`);
  const supabase = await getClientSupabaseClientStrict(tenantId);
  
  if (!supabase) {
    console.error('Failed to get Supabase client');
    process.exit(1);
  }

  const tables = [
    'dados_cliente',
    'form_submissions_compliance_tracking',
    'form_submissions',
    'cpf_compliance_results',
    'reunioes',
    'clientes_completos'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Updating ${table}...`);
      // Warning: supabase doesn't easily do UPDATE without match or eq, we'll try to select and then update, or update all (if possible)
      // Since we want ALL to be 'emerick', we can fetch all records that are NOT emerick or are null
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .neq('tenant_id', 'emerick');
        
      if (error) {
         // Also fetch where tenant_id is null
         console.log(`Error checking neq 'emerick' for ${table}:`, error.message);
      }
      
      const { data: nullData } = await supabase.from(table).select('id').is('tenant_id', null);
      
      const allIdsToUpdate = [...(data || []), ...(nullData || [])].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      
      if (allIdsToUpdate.length === 0) {
        console.log(`- No rows to update in ${table}`);
        continue;
      }
      
      console.log(`- Found ${allIdsToUpdate.length} rows to update in ${table}`);
      
      let updatedCount = 0;
      for (const row of allIdsToUpdate) {
          const { error: upError } = await supabase
             .from(table)
             .update({ tenant_id: 'emerick' })
             .eq('id', row.id);
          if (!upError) updatedCount++;
      }
      
      console.log(`- Updated ${updatedCount} rows in ${table}`);
    } catch (err) {
      console.log(`- Error updating ${table}: ${err.message}`);
    }
  }
  process.exit(0);
}

run();
