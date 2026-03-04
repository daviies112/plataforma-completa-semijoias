import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

// ── Conectar ao Postgres local ──────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_LOCAL_URL
});

// ── Conectar ao Supabase (Owner) ────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_LOCAL_URL,
  process.env.SUPABASE_LOCAL_SERVICE_KEY
);

const FORMS = [
  {
    id: '12e608e1-cf37-49b1-bcfc-7bab82822e84',
    title: 'Formulário de Qualificação',
    slug: 'formulario-de-qualificacao',
    description: 'Responda as perguntas abaixo para verificar se você está qualificado para uma reunião com nosso time.',
    tenant_id: 'emericks-tenant',
    questions: '[]',
    elements: '[]',
    passing_score: 20
  },
  {
    id: '0a3514bb-75cc-47cf-81cd-7994724b126d',
    title: 'Formulário de Qualificação (2)',
    slug: 'formulario-de-qualificacao-2',
    description: 'Formulário de qualificação com perguntas de múltipla escolha.',
    tenant_id: 'emericks-tenant',
    questions: JSON.stringify([{"id":"1772286063108","text":"teste","type":"question","points":10,"options":[{"id":"1772286082318","text":"t","points":10}],"required":true,"questionType":"multiple-choice","elementTypeVersion":1}]),
    elements: 'null',
    passing_score: 20
  }
];

const ACTIVE_FORM_ID = '12e608e1-cf37-49b1-bcfc-7bab82822e84';
const ACTIVE_FORM_SLUG = 'formulario-de-qualificacao';
const COMPANY_SLUG = 'emericks';
const TENANT_ID = 'emericks-tenant';
const APP_DOMAIN = process.env.APP_DOMAIN || 'localhost:5000';

async function run() {
  const client = await pool.connect();

  try {
    console.log('🔧 Iniciando correção de formulários...\n');

    // 1. Inserir formulários na tabela local
    for (const form of FORMS) {
      const result = await client.query(`
        INSERT INTO forms (id, title, slug, description, tenant_id, questions, elements, passing_score, is_public, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          is_public = true,
          updated_at = NOW()
        RETURNING id, title, slug
      `, [form.id, form.title, form.slug, form.description, form.tenant_id,
          form.questions, form.elements || 'null', form.passing_score]);
      console.log(`✅ Form inserido/atualizado: ${result.rows[0]?.title} [${result.rows[0]?.slug}]`);
    }

    // 2. Criar/atualizar form_tenant_mapping
    for (const form of FORMS) {
      await client.query(`
        INSERT INTO form_tenant_mapping (form_id, tenant_id, company_slug, is_public, created_at)
        VALUES ($1, $2, $3, true, NOW())
        ON CONFLICT DO NOTHING
      `, [form.id, form.tenant_id, COMPANY_SLUG]);
      console.log(`✅ Mapping criado para: ${form.id}`);
    }

    // 3. Verificar/atualizar app_settings para apontar para o form ativo
    const protocol = APP_DOMAIN.includes('localhost') ? 'http' : 'https';
    const formUrl = `${protocol}://${APP_DOMAIN}/formulario/${COMPANY_SLUG}/form/${ACTIVE_FORM_SLUG}`;
    
    const settingsCheck = await client.query('SELECT id FROM app_settings LIMIT 1');
    if (settingsCheck.rows.length > 0) {
      await client.query(`
        UPDATE app_settings SET
          active_form_id = $1,
          active_form_url = $2,
          company_slug = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [ACTIVE_FORM_ID, formUrl, COMPANY_SLUG, settingsCheck.rows[0].id]);
      console.log(`✅ app_settings atualizado: form ativo = ${ACTIVE_FORM_SLUG}`);
    }

    console.log('\n📊 Verificando resultado no Postgres local:');
    const formsCount = await client.query('SELECT COUNT(*) FROM forms');
    const mappingCount = await client.query('SELECT COUNT(*) FROM form_tenant_mapping');
    console.log(`   Forms: ${formsCount.rows[0].count}`);
    console.log(`   Mappings: ${mappingCount.rows[0].count}`);

    // 4. Marcar forms como PUBLIC no Supabase
    console.log('\n🌐 Atualizando is_public no Supabase...');
    const { data, error } = await supabase
      .from('forms')
      .update({ is_public: true })
      .eq('tenant_id', TENANT_ID);
    
    if (error) {
      console.warn('⚠️  Erro ao atualizar Supabase (não crítico):', error.message);
    } else {
      console.log('✅ Forms marcados como públicos no Supabase');
    }

    // 5. Verificar app_settings no Supabase
    const { data: supabaseSettings } = await supabase
      .from('app_settings')
      .select('active_form_id, active_form_url, company_slug')
      .limit(1)
      .maybeSingle();
    
    if (supabaseSettings) {
      console.log('\n📋 app_settings no Supabase:', supabaseSettings);
    }

    console.log('\n✅ CORREÇÃO CONCLUÍDA!');
    console.log(`\n🔗 URL do formulário ativo:`);
    console.log(`   ${formUrl}`);
    console.log(`\nSe o servidor estiver em produção, tente:`);
    console.log(`   http://localhost:5000/formulario/${COMPANY_SLUG}/form/${ACTIVE_FORM_SLUG}`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
