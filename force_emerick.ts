import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('📡 Accessing local database...');
    
    // 1. Config Database Connection for 'emerick'
    const insertConfig = `
      INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (tenant_id) DO UPDATE 
      SET supabase_url = EXCLUDED.supabase_url, supabase_anon_key = EXCLUDED.supabase_anon_key, updated_at = NOW();
    `;
    
    await pool.query(insertConfig, [
      'emerick', 
      'https://semijoias-supabase.y98g1d.easypanel.host', 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
    ]);
    console.log('✅ Configured emerick in supabase_config');

    // 2. Force tenant_id in ALL major tables
    const tables = [
      'dados_cliente', 'form_submissions', 'form_submissions_compliance_tracking', 
      'cpf_compliance_results', 'reunioes', 'reuniao', 'n8n_chat_histories',
      'formulario_envios'
    ];

    for (const table of tables) {
      try {
        const updateSql = `UPDATE ${table} SET tenant_id = 'emerick' WHERE tenant_id IS NULL OR tenant_id != 'emerick'`;
        const res = await pool.query(updateSql);
        console.log(`✅ ${table}: Updated ${res.rowCount} rows to emerick`);
      } catch (e: any) {
        console.warn(`⚠️ Table ${table} ignored or error: ${e.message}`);
      }
    }

  } catch (err: any) {
    console.error('❌ Critical Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
