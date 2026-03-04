
import 'dotenv/config';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';
import { getClientSupabaseClient } from '../server/lib/multiTenantSupabase.js';

async function findMeeting() {
  const meetingId = '28e47a33-bcd3-4d71-878b-c18ce452b37e';
  console.log(`🔍 [FIND] Procurando ID: ${meetingId} em todos os tenants...`);

  // Fetch tenants directly from the database
  const tenantResults = await db.select(sql`tenant_id`).from(sql`supabase_config`);
  const tenants = tenantResults.map(r => r.tenant_id);
  const allTenants = Array.from(new Set([...tenants, 'system', 'local', 'supabase_local', 'nexus_completa', 'nexus_intelligence']));

  for (const tId of allTenants) {
    try {
      const supabase = await getClientSupabaseClient(tId);
      if (!supabase) {
        console.log(`- [${tId}] Supabase não configurado`);
        continue;
      }

      // Testar tabelas comuns
      const tables = ['reunioes', 'reuniao', 'meetings', 'meeting'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id, titulo')
            .or(`id.eq.${meetingId},room_id_100ms.eq.${meetingId}`)
            .maybeSingle();

          if (!error && data) {
            console.log(`✅ [FOUND] Encontrado no tenant "${tId}", tabela "${table}":`, data);
            return;
          }
        } catch (e) {
          // Tabela pode não existir
        }
      }
      console.log(`- [${tId}] Não encontrado`);
    } catch (err) {
      console.log(`- [${tId}] Erro: ${err.message}`);
    }
  }

  console.log('❌ [NOT FOUND] ID não encontrado em nenhum tenant.');
}

findMeeting();
