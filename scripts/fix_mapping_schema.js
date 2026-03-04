import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_LOCAL_URL
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧 Adicionando colunas faltantes em form_tenant_mapping...');

    // Adicionar coluna slug (usada pelo código mas não existe na tabela)
    await client.query(`
      ALTER TABLE form_tenant_mapping 
      ADD COLUMN IF NOT EXISTS slug TEXT;
    `);
    console.log('✅ Coluna slug adicionada');

    // Adicionar coluna updated_at (usada em UPDATE mas não existe)
    await client.query(`
      ALTER TABLE form_tenant_mapping 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);
    console.log('✅ Coluna updated_at adicionada');

    // Preencher o slug com os valores corretos nos registros existentes
    await client.query(`
      UPDATE form_tenant_mapping 
      SET slug = 'formulario-de-qualificacao', updated_at = NOW()
      WHERE form_id = '12e608e1-cf37-49b1-bcfc-7bab82822e84';
    `);
    await client.query(`
      UPDATE form_tenant_mapping 
      SET slug = 'formulario-de-qualificacao-2', updated_at = NOW()
      WHERE form_id = '0a3514bb-75cc-47cf-81cd-7994724b126d';
    `);
    console.log('✅ Slugs preenchidos nos registros existentes');

    // Verificar resultado final
    const res = await client.query('SELECT * FROM form_tenant_mapping');
    console.log('\n📊 form_tenant_mapping atualizado:');
    res.rows.forEach(r => {
      console.log(`   [${r.id}] form_id: ${r.form_id.substring(0,8)}... | slug: ${r.slug} | company: ${r.company_slug} | public: ${r.is_public}`);
    });

    console.log('\n✅ CORREÇÃO CONCLUÍDA! Reinicie o servidor para aplicar.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
