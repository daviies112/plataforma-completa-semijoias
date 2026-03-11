
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import { createClient } from '@supabase/supabase-js';

async function run() {
    const meetingId = '28e47a33-bcd3-4d71-878b-c18ce452b37e';
    const databaseUrl = "postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres";
    
    console.log(`🔍 [DEBUG] Searching for ${meetingId}...`);
    
    const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    
    try {
        const { rows } = await pool.query('SELECT tenant_id, supabase_url, supabase_service_role_key FROM supabase_config');
        console.log(`Found ${rows.length} tenants in config.`);
        
        for (const row of rows) {
            if (!row.supabase_url || !row.supabase_service_role_key) continue;
            
            console.log(`- Checking tenant: ${row.tenant_id} (${row.supabase_url})`);
            try {
                const supabase = createClient(row.supabase_url, row.supabase_service_role_key, { auth: { persistSession: false } });
                const { data, error } = await supabase
                    .from('reunioes')
                    .select('id, titulo')
                    .or(`id.eq.${meetingId},room_id_100ms.eq.${meetingId}`)
                    .maybeSingle();
                
                if (data) {
                    console.log(`✅ FOUND in tenant ${row.tenant_id}:`, data);
                    process.exit(0);
                }
            } catch (e) {
                console.log(`  [${row.tenant_id}] error: ${e.message}`);
            }
        }
    } finally {
        await pool.end();
        console.log('Search finished.');
    }
}

run();
