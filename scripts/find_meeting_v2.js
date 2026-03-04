
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import { createClient } from '@supabase/supabase-js';

async function findMeeting() {
  const meetingId = '28e47a33-bcd3-4d71-878b-c18ce452b37e';
  console.log(`🔍 [FIND] Procurando ID: ${meetingId} em todos os tenants (Self-Contained)...`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não definida no .env');
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    const tenantResults = await pool.query('SELECT tenant_id, supabase_url, supabase_service_role_key FROM supabase_config');
    const tenants = tenantResults.rows;
    console.log(`Found ${tenants.length} tenants in supabase_config`);

    const allTenants = [
        ...tenants,
        { tenant_id: 'system', supabase_url: process.env.SUPABASE_URL, supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY },
        { tenant_id: 'env_nexus', supabase_url: process.env.REACT_APP_SUPABASE_URL, supabase_service_role_key: process.env.REACT_APP_SUPABASE_SERVICE_ROLE }
    ].filter(t => t.supabase_url && t.supabase_service_role_key);

    for (const t of allTenants) {
      console.log(`- Verificando tenant: ${t.tenant_id} (${t.supabase_url})`);
      try {
        const supabase = createClient(t.supabase_url, t.supabase_service_role_key);
        
        const tables = ['reunioes', 'reuniao', 'meetings', 'meeting'];
        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .select('id, titulo')
            .or(`id.eq.${meetingId},room_id_100ms.eq.${meetingId}`)
            .maybeSingle();

          if (!error && data) {
            console.log(`✅ [FOUND] Encontrado no tenant "${t.tenant_id}", tabela "${table}":`, data);
            return;
          }
        }
      } catch (err) {
        console.log(`  [${t.tenant_id}] Erro: ${err.message}`);
      }
    }
    console.log('❌ [NOT FOUND] ID não encontrado em nenhum tenant.');
  } finally {
    await pool.end();
  }
}

findMeeting();
