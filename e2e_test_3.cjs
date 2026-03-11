
const http = require('http');

function postJson(path, body, cookieHeader, authHeader) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      host: 'localhost',
      port: 5001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.status || res.statusCode, data, setCookies }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('\n[TEST] Logging in...');
  const body = { email: 'contato@emericks.com.br', senha: 'Gabriel15@' };
  const resp = await postJson('/api/auth/login', body);
  
  if (resp.status !== 200) {
      console.log('Login failed:', resp.status, resp.data);
      return;
  }
  
  let token = '';
  try {
    const d = JSON.parse(resp.data);
    token = d.token || d.accessToken || '';
  } catch(e) {}
  
  let cookie = '';
  if (resp.setCookies && resp.setCookies.length) {
      cookie = resp.setCookies[0].split(';')[0];
  }
  
  console.log('[TEST] Checking QR payload...');
  const authHeader = token ? 'Bearer ' + token : null;
  const qrResp = await postJson('/api/evolution/qrcode', { instance: 'emerick' }, cookie, authHeader);
  console.log('QR Status:', qrResp.status);
  
  try {
      const qrData = JSON.parse(qrResp.data);
      if (qrData.qrCode) {
          console.log('qrCode starts with data:image/png;base64:', qrData.qrCode.startsWith('data:image/png;base64,'));
          console.log('qrCode length:', qrData.qrCode.length);
          qrData.qrCode = '[TRUNCATED_FOR_DISPLAY]';
      }
      console.log('QR Response JSON:', JSON.stringify(qrData));
  } catch(e) {
      console.log('QR Response RAW:', qrResp.data.substring(0, 500));
  }
}

run().catch(console.error);
