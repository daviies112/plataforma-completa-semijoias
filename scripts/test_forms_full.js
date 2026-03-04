/**
 * Teste com cookie de sessão (como o browser faz)
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const BASE = 'http://localhost:5000';

async function apiFetch(url, options = {}, cookies = '') {
  const resp = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
      ...(options.headers || {})
    },
    credentials: 'include',
    ...options
  });
  const setCookie = resp.headers.get('set-cookie') || '';
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: resp.status, body: json, setCookie };
}

async function run() {
  console.log('=== TESTE COMPLETO DOS FORMULÁRIOS ===\n');

  // 1. Login (cria sessão com cookie)
  console.log('1. Login...');
  const login = await apiFetch(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'contato@emericks.com.br', password: 'Gabriel15@' })
  });
  
  console.log('   Status:', login.status);
  if (login.status !== 200) {
    console.error('   ERRO:', JSON.stringify(login.body));
    return;
  }
  
  const sessionCookie = login.setCookie.split(';')[0]; // pega apenas o connect.sid
  console.log('   ✅ Login OK, session cookie obtido');
  console.log('   Tenant:', login.body?.client?.id);

  // 2. GET formulário ativo configurado
  console.log('\n2. GET /api/formularios/config/ativo...');
  const getAtivo = await apiFetch(`${BASE}/api/formularios/config/ativo`, {}, sessionCookie);
  console.log('   Status:', getAtivo.status);
  if (getAtivo.status === 200) {
    console.log('   ✅ Form ativo:', getAtivo.body?.id?.substring(0,8), '|', getAtivo.body?.title);
    console.log('   URL:', getAtivo.body?.url);
  } else {
    console.log('   Body:', JSON.stringify(getAtivo.body).substring(0, 200));
  }

  // 3. PUT marcar formulário como ativo (o que estava quebrando com 500)
  console.log('\n3. PUT /api/formularios/config/ativo (marcar form ativo)...');
  const putAtivo = await apiFetch(`${BASE}/api/formularios/config/ativo`, {
    method: 'PUT',
    body: JSON.stringify({
      formId: '12e608e1-cf37-49b1-bcfc-7bab82822e84',
      companySlug: 'emericks'
    })
  }, sessionCookie);
  
  console.log('   Status:', putAtivo.status);
  if (putAtivo.status === 200) {
    console.log('   ✅ SUCESSO! Form marcado como ativo:');
    console.log('   URL:', putAtivo.body?.activeFormUrl);
    console.log('   Company:', putAtivo.body?.companySlug);
    console.log('   Slug:', putAtivo.body?.formSlug);
  } else {
    console.log('   ❌ ERRO:', JSON.stringify(putAtivo.body));
  }

  // 4. GET lista de formulários (o que a plataforma exibe)
  console.log('\n4. GET /api/formularios/list (lista de formulários)...');
  const list = await apiFetch(`${BASE}/api/formularios/list`, {}, sessionCookie);
  console.log('   Status:', list.status);
  console.log('   Body:', JSON.stringify(list.body).substring(0, 300));

  // 5. GET direto do ativo
  console.log('\n5. GET /api/formularios/ativo...');
  const ativo = await apiFetch(`${BASE}/api/formularios/ativo`, {}, sessionCookie);
  console.log('   Status:', ativo.status);
  if (ativo.status === 200) {
    console.log('   ✅ Form ativo retornado:', ativo.body?.title || ativo.body?.id);
    console.log('   URL pública:', ativo.body?.url);
  } else {
    console.log('   Body:', JSON.stringify(ativo.body).substring(0, 200));
  }

  console.log('\n=== FIM DO TESTE ===');
}

run().catch(console.error);
