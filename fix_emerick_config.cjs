
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    try {
        const url = 'http://172.22.0.6:8000';
        const key = process.env.SUPABASE_LOCAL_KEY; // This is likely the service role key from .env
        
        console.log('Updating supabase_config for emerick...');
        await pool.query(
            "UPDATE supabase_config SET supabase_url = $1, supabase_anon_key = $2 WHERE tenant_id = 'emerick'",
            [url, key]
        );
        console.log('✅ Updated supabase_config!');
        
        const res = await pool.query("SELECT * FROM supabase_config WHERE tenant_id = 'emerick'");
        console.log(JSON.stringify(res.rows, null, 2));
        
    } catch(e) {
        console.error(e);
    } finally {
        await pool.end();
    }
})();
