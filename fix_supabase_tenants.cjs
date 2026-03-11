'use strict';
require('dotenv').config({ path: '/var/www/plataformacompleta/.env' });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:your-super-secret-and-long-postgres-password@172.19.0.5:5432/postgres?sslmode=disable'
});

const ENCRYPTION_KEY_B64 = process.env.CREDENTIALS_ENCRYPTION_KEY_BASE64;
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;

function getKey() {
  if (ENCRYPTION_KEY_B64) {
    const buf = Buffer.from(ENCRYPTION_KEY_B64, 'base64');
    return buf.length >= 32 ? buf.slice(0, 32) : Buffer.concat([buf, Buffer.alloc(32 - buf.length)], 32);
  }
  if (ENCRYPTION_KEY_RAW) {
    return Buffer.from(ENCRYPTION_KEY_RAW.padEnd(32, '0').slice(0, 32));
  }
  throw new Error('Nenhuma ENCRYPTION_KEY encontrada no .env');
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function tryDecrypt(data) {
  try {
    const key = getKey();
    const [ivHex, tagHex, encHex] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    return null;
  }
}

const SUPABASE_URL = 'https://semijoias-supabase.y98g1d.easypanel.host';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

async function run() {
  console.log('[fix_tenants] Lendo configurações atuais...');
  const all = await pool.query('SELECT tenant_id, supabase_url FROM supabase_config ORDER BY tenant_id');
  console.log('[fix_tenants] Rows encontradas:', all.rowCount);
  for (const row of all.rows) {
    const decrypted = tryDecrypt(row.supabase_url);
    console.log(
      `  - ${row.tenant_id}: ${
        decrypted ? '✅ Descriptografado OK → ' + decrypted.substring(0, 40) : '❌ Não descriptografável (chave antiga)'
      }`
    );
  }

  const encryptedUrl = encrypt(SUPABASE_URL);
  const encryptedAnon = encrypt(SUPABASE_ANON);
  const testDecrypt = tryDecrypt(encryptedUrl);
  if (testDecrypt !== SUPABASE_URL) {
    throw new Error('Falha de sanidade: encrypt → decrypt não retornou o valor original');
  }
  console.log('\n[fix_tenants] ✅ Chave de criptografia funcionando corretamente');

  const tenantsToFix = ['system', 'gleice', 'davisemi-joias'];
  for (const tenant of tenantsToFix) {
    const res = await pool.query(
      'UPDATE supabase_config SET supabase_url = $1, supabase_anon_key = $2 WHERE tenant_id = $3 RETURNING tenant_id',
      [encryptedUrl, encryptedAnon, tenant]
    );
    if (res.rowCount > 0) {
      console.log(`[fix_tenants] ✅ Tenant "${tenant}" atualizado`);
    } else {
      await pool.query(
        'INSERT INTO supabase_config (tenant_id, supabase_url, supabase_anon_key) VALUES ($1, $2, $3)',
        [tenant, encryptedUrl, encryptedAnon]
      );
      console.log(`[fix_tenants] ✅ Tenant "${tenant}" inserido`);
    }
  }

  const erickRows = await pool.query('SELECT ctid FROM supabase_config WHERE tenant_id = $1 ORDER BY ctid', [
    'emerick'
  ]);
  if (erickRows.rowCount > 1) {
    const firstCtid = erickRows.rows[0].ctid;
    await pool.query(`DELETE FROM supabase_config WHERE tenant_id = 'emerick' AND ctid != $1`, [firstCtid]);
    console.log(`[fix_tenants] ✅ ${erickRows.rowCount - 1} duplicata(s) de "emerick" removida(s)`);
  } else {
    console.log('[fix_tenants] ℹ️ Nenhuma duplicata de "emerick" encontrada');
  }

  console.log('\n[fix_tenants] ✅ Concluído! Verifique os logs do app após reiniciar o PM2.');
  await pool.end();
}

run().catch(e => {
  console.error('[fix_tenants] ❌ ERRO:', e.message);
  process.exit(1);
});
