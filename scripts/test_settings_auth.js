
import fetch from 'node-fetch';

async function testAuth() {
  const baseUrl = 'http://127.0.0.1:5000';
  
  console.log('🧪 [TEST] Verificando endpoints de configuração...');
  
  // 1. Test public route
  try {
    const publicRes = await fetch(`${baseUrl}/api/public/workspace/test_insert_2`);
    console.log(`✅ Public Route: ${publicRes.status}`);
  } catch (e) {
    console.error(`❌ Public Route Failed: ${e.message}`);
  }

  // 2. Test protected route (Expected 401 without cookie)
  try {
    const protectedRes = await fetch(`${baseUrl}/api/credentials`);
    console.log(`ℹ️ Protected Route (No Auth) status: ${protectedRes.status} (Expected 401)`);
  } catch (e) {
    console.error(`❌ Protected Route Test Failed: ${e.message}`);
  }

  // 3. Simulated Login and Session Test (if possible)
  // For now, we rely on the server logs to see if tokens are processed correctly
  
  console.log('🏁 Teste de conectividade básica concluído.');
}

testAuth();
