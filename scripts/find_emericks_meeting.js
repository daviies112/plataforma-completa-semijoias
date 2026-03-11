
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import { createClient } from '@supabase/supabase-js';

async function run() {
    const meetingId = '8595be25-0c2f-41ee-8721-baefa79ea84e';
    const databaseUrl = "postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres";
    
    console.log(`🔍 [DEBUG] Searching for ${meetingId} in 'emericks' related configs...`);
    
    const pool = new Pool({ connectionString: databaseUrl, ssl: false });
    
    try {
        // 1. Procurar tenant 'emericks'
        const { rows } = await pool.query("SELECT * FROM supabase_config WHERE tenant_id = 'emericks'");
        console.log(`Found ${rows.length} config rows for 'emericks'.`);
        
        if (rows.length > 0) {
            const row = rows[0];
            console.log(`- Supabase URL: ${row.supabase_url}`);
            
            try {
                const supabase = createClient(row.supabase_url, row.supabase_service_role_key);
                const { data, error } = await supabase
                    .from('reunioes')
                    .select('id, titulo')
                    .or(`id.eq.${meetingId},room_id_100ms.eq.${meetingId}`)
                    .maybeSingle();
                
                if (data) {
                    console.log(`✅ FOUND in tenant 'emericks':`, data);
                } else {
                    console.log(`❌ NOT FOUND in 'reunioes' table of 'emericks'. Error: ${error?.message}`);
                    
                    // Tentar outras tabelas
                    const tables = ['reuniao', 'meetings'];
                    for (const table of tables) {
                        const { data: d2 } = await supabase.from(table).select('id').eq('id', meetingId).maybeSingle();
                        if (d2) console.log(`✅ FOUND in tenant 'emericks', table ${table}`);
                    }
                }
            } catch (e) {
                console.log(`  [emericks] Supabase Client error: ${e.message}`);
            }
        } else {
            console.log("❌ Tenant 'emericks' not found in local database.");
            
            // Tentar encontrar qualquer tenant que tenha esse meetingId
            console.log("Searching all tenants for the ID...");
            const { rows: allRows } = await pool.query("SELECT tenant_id, supabase_url, supabase_service_role_key FROM supabase_config");
            for (const r of allRows) {
                if (!r.supabase_url || !r.supabase_service_role_key) continue;
                try {
                    const sb = createClient(r.supabase_url, r.supabase_service_role_key);
                    const { data } = await sb.from('reunioes').select('id').eq('id', meetingId).maybeSingle();
                    if (data) {
                        console.log(`✅ FOUND in tenant ${r.tenant_id}`);
                        break;
                    }
                } catch (err) {}
            }
        }
    } finally {
        await pool.end();
    }
}

run();
