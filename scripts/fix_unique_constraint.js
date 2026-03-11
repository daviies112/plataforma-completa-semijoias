import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧 Corrigindo duplicatas e adicionando constraint UNIQUE...\n');

    // 1. Remover duplicatas mantendo apenas o registro com menor id
    const del = await client.query(`
      DELETE FROM form_tenant_mapping 
      WHERE id NOT IN (
        SELECT MIN(id) FROM form_tenant_mapping GROUP BY form_id
      );
    `);
    console.log(`✅ ${del.rowCount} duplicata(s) removida(s)`);

    // 2. Adicionar constraint UNIQUE em form_id
    await client.query(`
      ALTER TABLE form_tenant_mapping 
      ADD CONSTRAINT form_tenant_mapping_form_id_unique UNIQUE (form_id);
    `);
    console.log('✅ Constraint UNIQUE(form_id) adicionada');

    // 3. Verificar resultado
    const data = await client.query(`SELECT id, form_id, slug, company_slug, is_public FROM form_tenant_mapping ORDER BY id;`);
    console.log('\n📊 form_tenant_mapping após correção:');
    data.rows.forEach(r => console.log(`   [${r.id}] ${r.form_id.substring(0,8)}... slug:${r.slug} company:${r.company_slug} public:${r.is_public}`));

    console.log('\n✅ Correção concluída!');
  } catch (e) {
    console.error('❌ Erro:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
