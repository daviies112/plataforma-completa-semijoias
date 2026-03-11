import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

// Login e teste completo dos endpoints de formulários
const BASE = 'http://localhost:5000';

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: resp.status, ok: resp.ok, body: json };
}

async function run() {
  console.log('=== DIAGNÓSTICO DE FORMULÁRIOS ===\n');

  // 1. Login
  console.log('1. Fazendo login...');
  const login = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'contato@emericks.com.br', password: 'Gabriel15@' })
  });
  console.log('   Status:', login.status);
  if (!login.ok) {
    console.error('   ERRO LOGIN:', login.body);
    return;
  }
  const token = login.body?.token;
  const tenantId = login.body?.client?.id;
  console.log('   ✅ Token OK, tenantId:', tenantId);

  const auth = { Authorization: `Bearer ${token}` };

  // 2. GET /api/formularios/ativo
  console.log('\n2. GET /api/formularios/ativo...');
  const ativo = await apiFetch('/api/formularios/ativo', { headers: auth });
  console.log('   Status:', ativo.status);
  if (ativo.ok) {
    console.log('   ✅ Form ativo:', ativo.body?.id, '|', ativo.body?.title);
    console.log('   URL:', ativo.body?.url);
    console.log('   companySlug:', ativo.body?.companySlug);
    console.log('   formSlug:', ativo.body?.formSlug);
  } else {
    console.error('   ❌ Erro:', JSON.stringify(ativo.body));
  }

  // 3. GET /api/formularios/list (se existir)
  console.log('\n3. GET /api/formularios/list...');
  const list = await apiFetch('/api/formularios/list', { headers: auth });
  console.log('   Status:', list.status, '| Body:', JSON.stringify(list.body).substring(0, 200));

  // 4. GET /api/formularios (raiz)
  console.log('\n4. GET /api/formularios...');
  const base = await apiFetch('/api/formularios', { headers: auth });
  console.log('   Status:', base.status, '| Body:', JSON.stringify(base.body).substring(0, 200));

  // 5. Testar endpoint público do formulário
  console.log('\n5. GET /formulario/emericks/form/formulario-de-qualificacao (público)...');
  const pub = await apiFetch('/formulario/emericks/form/formulario-de-qualificacao');
  console.log('   Status:', pub.status);
  if (pub.status === 200) {
    console.log('   ✅ Formulário público ACESSÍVEL!');
  } else {
    console.log('   Body:', JSON.stringify(pub.body).substring(0, 300));
  }

  // 6. Verificar Supabase diretamente
  console.log('\n6. Verificando forms no Supabase...');
  const supabase = createClient(
    process.env.SUPABASE_LOCAL_URL,
    process.env.SUPABASE_LOCAL_SERVICE_KEY
  );
  const { data: forms, error } = await supabase.from('forms').select('id, title, slug, is_public, tenant_id');
  if (error) {
    console.error('   Erro Supabase:', error.message);
  } else {
    console.log(`   ✅ ${forms.length} form(s) no Supabase:`);
    forms.forEach(f => console.log(`      [${f.is_public ? 'PUBLIC' : 'PRIVATE'}] ${f.title} | slug: ${f.slug}`));
  }

  // 7. Atualizar is_public no Supabase para TRUE
  console.log('\n7. Forçando is_public=true no Supabase...');
  const { error: updateErr } = await supabase
    .from('forms')
    .update({ is_public: true })
    .eq('tenant_id', 'emericks-tenant');
  if (updateErr) {
    console.error('   Erro:', updateErr.message);
  } else {
    console.log('   ✅ Forms marcados como públicos no Supabase!');
  }

  console.log('\n=== FIM DO DIAGNÓSTICO ===');
}

run().catch(console.error);
