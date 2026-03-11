/**
 * Migration: adicionar colunas faltantes na tabela revendedoras
 * Executar com: npx tsx scripts/migrate_revendedoras.ts
 */
import { Pool } from 'pg';
import { readFileSync } from 'fs';

let dbUrl = process.env.DATABASE_URL;

// Tentar ler da config local se DATABASE_URL não existe
if (!dbUrl) {
  try {
    const envContent = readFileSync('.env', 'utf8');
    const match = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (match) dbUrl = match[1];
  } catch(e) {}
}

if (!dbUrl) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: false,
  connectionTimeoutMillis: 15000
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔌 Conectado ao banco de dados.');

    // 1. Adicionar revendedora_id
    console.log('\n📋 Adicionando coluna revendedora_id...');
    await client.query(`
      ALTER TABLE revendedoras 
      ADD COLUMN IF NOT EXISTS revendedora_id UUID DEFAULT gen_random_uuid()
    `);
    console.log('✅ revendedora_id adicionada');

    // 2. Adicionar cpf_normalizado
    console.log('📋 Adicionando coluna cpf_normalizado...');
    await client.query(`
      ALTER TABLE revendedoras 
      ADD COLUMN IF NOT EXISTS cpf_normalizado TEXT
    `);
    console.log('✅ cpf_normalizado adicionada');

    // 3. Popular cpf_normalizado com dados existentes
    console.log('📋 Populando cpf_normalizado com dados existentes...');
    const updateResult = await client.query(`
      UPDATE revendedoras 
      SET cpf_normalizado = regexp_replace(cpf, '[^0-9]', '', 'g')
      WHERE cpf IS NOT NULL AND (cpf_normalizado IS NULL OR cpf_normalizado = '')
      RETURNING id, cpf, cpf_normalizado
    `);
    console.log(`✅ ${updateResult.rowCount} revendedoras atualizadas com cpf_normalizado`);

    // 4. Criar índices para performance
    console.log('📋 Criando índices...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_revendedoras_cpf_norm ON revendedoras(cpf_normalizado);
      CREATE INDEX IF NOT EXISTS idx_revendedoras_tenant_id ON revendedoras(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_revendedoras_rev_id ON revendedoras(revendedora_id);
    `);
    console.log('✅ Índices criados');

    // 5. Verificar resultado
    const check = await client.query(`
      SELECT id, nome, cpf, cpf_normalizado, revendedora_id, tenant_id 
      FROM revendedoras 
      LIMIT 5
    `);
    console.log('\n📊 Estado final das revendedoras:');
    check.rows.forEach(r => console.log(JSON.stringify(r)));

    // 6. Corrigir tenant_id dos leads com gleice → davisemi-joias
    console.log('\n📋 Verificando leads com tenant_id obsoleto...');
    const staleLeads = await client.query(
      `SELECT id, nome, tenant_id FROM leads WHERE tenant_id = 'gleice'`
    );
    if (staleLeads.rows.length > 0) {
      console.log(`Encontrados ${staleLeads.rows.length} leads com tenant_id='gleice'`);
      const fix = await client.query(
        `UPDATE leads SET tenant_id = 'davisemi-joias' WHERE tenant_id = 'gleice' RETURNING id, nome, tenant_id`
      );
      console.log(`✅ ${fix.rowCount} leads migrados para davisemi-joias:`);
      fix.rows.forEach(r => console.log(`  - ${r.nome}: ${r.tenant_id}`));
    } else {
      console.log('✅ Nenhum lead com tenant_id obsoleto');
    }

    // 7. Verificar supabase_config
    console.log('\n📋 Estado da supabase_config:');
    const cfgs = await client.query(
      `SELECT tenant_id, substring(supabase_url, 1, 60) as url FROM supabase_config ORDER BY tenant_id`
    );
    cfgs.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n✅ MIGRATION CONCLUÍDA COM SUCESSO!\n');
  } catch (error: any) {
    console.error('❌ Erro durante migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
