import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable',
});

const SUPABASE_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

async function main() {
  console.log('🔗 Connecting to LOCAL PostgreSQL...');

  // Check current supabase_config content
  console.log('\n📋 Current supabase_config:');
  const existing = await pool.query('SELECT id, tenant_id, supabase_url, supabase_anon_key FROM supabase_config LIMIT 20');
  existing.rows.forEach(r => {
    console.log(`  tenant: ${r.tenant_id} | url: ${(r.supabase_url || '').substring(0, 40)} | key: ${(r.supabase_anon_key || '').substring(0, 20)}...`);
  });

  const emerickRow = existing.rows.find(r => r.tenant_id === 'emerick');

  if (emerickRow) {
    console.log('\n⚠️  emerick found but URL might be wrong. Updating...');
    await pool.query(
      `UPDATE supabase_config SET supabase_url = $1, supabase_anon_key = $2, updated_at = NOW() WHERE tenant_id = $3`,
      [SUPABASE_URL, ANON_KEY, 'emerick']
    );
    console.log('✅ emerick UPDATED in PostgreSQL!');
  } else {
    console.log('\n🔧 emerick NOT found. Inserting...');
    // Check table columns first
    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'supabase_config' ORDER BY ordinal_position
    `);
    console.log('  Columns:', cols.rows.map(r => r.column_name).join(', '));

    // Insert with correct columns
    const hasServiceKey = cols.rows.find(r => r.column_name === 'supabase_service_role_key');
    
    if (hasServiceKey) {
      await pool.query(
        `INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_service_role_key, supabase_bucket, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        ['emerick', SUPABASE_URL, ANON_KEY, SERVICE_KEY, 'semijoias']
      );
    } else {
      await pool.query(
        `INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key, supabase_bucket, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        ['emerick', SUPABASE_URL, ANON_KEY, 'semijoias']
      );
    }
    console.log('✅ emerick INSERTED into LOCAL PostgreSQL!');
  }

  // Verify
  const verify = await pool.query('SELECT tenant_id, supabase_url FROM supabase_config WHERE tenant_id = $1', ['emerick']);
  console.log('\n✅ Verified:', JSON.stringify(verify.rows));

  await pool.end();
  console.log('\n🎉 DONE! Reinicie o servidor e recarregue o Kanban.');
}

main().catch(e => {
  console.error('❌ FATAL:', e.message);
  pool.end();
});
