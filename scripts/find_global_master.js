
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import { createClient } from '@supabase/supabase-js';

async function run() {
    const meetingId = '8595be25-0c2f-41ee-8721-baefa79ea84e';
    const databaseUrl = "postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres";
    
    console.log(`🔍 [DEBUG] Searching for ${meetingId} in all master configs...`);
    
    const pool = new Pool({ connectionString: databaseUrl, ssl: false });
    
    try {
        const { rows } = await pool.query('SELECT tenant_id, supabase_master_url, supabase_master_service_role_key FROM supabase_master_config');
        console.log(`Found ${rows.length} master tenants.`);
        
        for (const row of rows) {
            if (!row.supabase_master_url || !row.supabase_master_service_role_key) continue;
            
            console.log(`- Checking tenant: ${row.tenant_id} (${row.supabase_master_url})`);
            try {
                const supabase = createClient(row.supabase_master_url, row.supabase_master_service_role_key);
                const { data, error } = await supabase
                    .from('reunioes')
                    .select('id, titulo')
                    .or(`id.eq.${meetingId},room_id_100ms.eq.${meetingId}`)
                    .maybeSingle();
                
                if (data) {
                    console.log(`✅ FOUND in tenant ${row.tenant_id}:`, data);
                    return;
                }
            } catch (e) {
                console.log(`  [${row.tenant_id}] error: ${e.message}`);
            }
        }

        // Tentar no Supabase Local também
        console.log("- Checking LOCAL Supabase...");
        const localClient = createClient("http://103.199.187.145:8100", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwOTM5NjkwLCJleHAiOjIwODYyOTk2OTB9.wr0LSRqe7LmvQLp7z1sHrGolTBd8fVIc3LPZMg0fTTI");
        const { data: localData } = await localClient.from('reunioes').select('id, titulo').or(`id.eq.${meetingId},room_id_100ms.eq.${meetingId}`).maybeSingle();
        if (localData) {
            console.log(`✅ FOUND in LOCAL Supabase:`, localData);
            return;
        }

    } finally {
        await pool.end();
        console.log('Search finished.');
    }
}

run();
