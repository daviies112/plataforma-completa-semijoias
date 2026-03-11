
const http = require('http');

function postJson(path, body, cookieHeader) {
  return new Promise((resolve) => {
    const bodyStr = JSON.stringify(body);
    const req = http.request({
      host: 'localhost', port: 5001, path: path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...(cookieHeader ? { 'Cookie': cookieHeader } : {}) }
    }, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.status || res.statusCode, data, setCookies }));
    });
    req.on('error', () => resolve({}));
    req.write(bodyStr);
    req.end();
  });
}

function getJson(path, cookieHeader, authHeader) {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost', port: 5001, path: path, method: 'GET',
      headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { 'Cookie': cookieHeader } : {}), ...(authHeader ? { 'Authorization': authHeader } : {}) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', () => resolve({}));
    req.end();
  });
}

async function run() {
  const resp = await postJson('/api/auth/login', { email: 'contato@emericks.com.br', senha: 'Gabriel15@' });
  let token = '';
  try { token = JSON.parse(resp.data).token || ''; } catch(e){}
  const cookie = (resp.setCookies && resp.setCookies[0]) ? resp.setCookies[0].split(';')[0] : '';
  const authHeader = token ? 'Bearer ' + token : null;
  
  console.log('[TEST] Checking /api/evolution/status...');
  const statusResp = await getJson('/api/evolution/status', cookie, authHeader);
  console.log('Status HTTP Code:', statusResp.status);
  console.log('Status JSON Data:', statusResp.data);
}

run().catch(console.error);
