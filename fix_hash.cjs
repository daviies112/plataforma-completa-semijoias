'use strict';
require('dotenv').config({ path: '/var/www/plataformacompleta/.env' });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:your-super-secret-and-long-postgres-password@172.19.0.5:5432/postgres?sslmode=disable'
});

async function run() {
  console.log('[fix_hash] Gerando hash bcrypt para Gabriel15@...');
  const hash = await bcrypt.hash('Gabriel15@', 10);
  console.log('[fix_hash] Hash gerado:', hash.substring(0, 30) + '...');
  const result = await pool.query(
    "UPDATE admin_users SET password_hash = $1 WHERE email = 'contato@emericks.com.br' RETURNING email, tenant_id",
    [hash]
  );
  if (result.rowCount === 0) {
    console.error('[fix_hash] ❌ Nenhuma linha atualizada. Verifique se o email existe.');
  } else {
    console.log(
      '[fix_hash] ✅ Hash atualizado para:',
      result.rows[0].email,
      '/ tenant:',
      result.rows[0].tenant_id
    );
  }
  const check = await pool.query("SELECT password_hash FROM admin_users WHERE email = 'contato@emericks.com.br'");
  const valid = await bcrypt.compare('Gabriel15@', check.rows[0].password_hash);
  console.log('[fix_hash] ✅ Verificação bcrypt.compare result:', valid);
  await pool.end();
  process.exit(valid ? 0 : 1);
}

run().catch(e => {
  console.error('[fix_hash] ❌ ERRO:', e.message);
  process.exit(1);
});
