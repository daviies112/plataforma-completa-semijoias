const http = require('http');

function req(m, p, b, t, c) {
  return new Promise(resolve => {
    const h = {'Content-Type':'application/json'};
    if (t) h['Authorization']='Bearer '+t;
    if (c) h['Cookie']=c;
    const opts = {hostname:'localhost',port:5000,path:p,method:m,headers:h};
    const r = http.request(opts, res => {
      let d=''; const ck=res.headers['set-cookie']||[];
      res.on('data',x=>d+=x);
      res.on('end',()=>{let p;try{p=JSON.parse(d)}catch(e){p={raw:d.substring(0,200)}}resolve({s:res.statusCode,d:p,ck});});
    });
    r.on('error',e=>resolve({s:0,e:e.message}));
    if(b)r.write(JSON.stringify(b));
    r.end();
  });
}

async function testTenant(email, pass, label) {
  console.log('\n' + '='.repeat(55));
  console.log('TENANT: ' + label);
  console.log('='.repeat(55));
  const L = await req('POST','/api/auth/login',{email,senha:pass});
  if (L.s !== 200) { console.log('LOGIN FAILED:', L.s); return null; }
  const t = L.d.token;
  const c = L.ck.map(x=>x.split(';')[0]).join('; ');
  const tenantId = L.d.user && L.d.user.tenant_id;
  console.log('[LOGIN]      tenantId:', tenantId, String.fromCodePoint(0x2705));

  const pl = await req('GET','/api/leads-pipeline/'+tenantId,null,t,c);
  const leads = (pl.d && pl.d.data && pl.d.data.leads) || [];
  const plOk = pl.s === 200 || pl.s === 202;
  console.log('[PIPELINE]   status:', pl.s, '| leads:', leads.length, plOk ? String.fromCodePoint(0x2705) : String.fromCodePoint(0x26A0) + ' sem dados');

  const ws = await req('GET','/api/workspace/load',null,t,c);
  const wd = ws.d && ws.d.data;
  const pages = wd && wd.pages ? wd.pages.length : 0;
  const boards = wd && wd.boards ? wd.boards.length : 0;
  const wsOk = pages > 0 || boards > 0;
  console.log('[WORKSPACE]  status:', ws.s, '| pages:', pages, '| boards:', boards, wsOk ? String.fromCodePoint(0x2705) : String.fromCodePoint(0x26A0) + ' sem dados');

  const mt = await req('GET','/api/reunioes',null,t,c);
  const mc = (mt.d && mt.d.data && Array.isArray(mt.d.data)) ? mt.d.data.length : 0;
  const mtOk = mc > 0;
  console.log('[REUNIOES]   status:', mt.s, '| count:', mc, mtOk ? String.fromCodePoint(0x2705) : String.fromCodePoint(0x26A0) + ' sem dados');

  const db = await req('GET','/api/dashboard/dashboard-data',null,t,c);
  const agg = db.d && db.d.aggregatedData;
  console.log('[DASHBOARD]  status:', db.s, '| forms:', agg && agg.forms && agg.forms.formsCount, String.fromCodePoint(0x2705));

  return { tenantId, t, c };
}

async function main() {
  const r1 = await testTenant('contato@emericks.com.br', '230723Davi#', 'emericks-tenant');
  const r2 = await testTenant('daviemericko@gmail.com', '230723Davi#', 'davisemi-joias');

  // Isolation test
  console.log('\n' + '='.repeat(55));
  console.log('ISOLATION TEST');
  console.log('='.repeat(55));
  if (r1 && r2) {
    const att = await req('GET','/api/leads-pipeline/'+r2.tenantId,null,r1.t,r1.c);
    if (att.s === 403) {
      console.log('[ISOLATION]  Tenant1 nao acessa Tenant2: ' + String.fromCodePoint(0x2705) + ' 403 BLOQUEADO');
    } else {
      console.log('[ISOLATION]  FALHA DE ISOLAMENTO! Status:', att.s);
    }
  }

  console.log('\n' + '='.repeat(55));
  console.log('TESTE FINALIZADO');
  console.log('='.repeat(55));
}

main().catch(console.error);
