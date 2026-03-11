
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:your-super-secret-and-long-postgres-password@172.19.0.5:5432/postgres'
});

async function run() {
  const hash = '$2a$10$C823Lw28T/Y.qXX.nKzJ/eqlH0XvJvGZgM37lOrN0OaN9rXgN.pIq'; // Hash for Gabriel15@
  await pool.query('UPDATE admin_users SET password_hash = $1 WHERE email = \'contato@emericks.com.br\'', [hash]);
  console.log('Update OK');
  process.exit(0);
}
run();

