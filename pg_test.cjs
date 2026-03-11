
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:your-super-secret-and-long-postgres-password@172.19.0.5:5432/postgres?sslmode=disable' });
pool.query('SELECT count(*) FROM admin_users').then(r => { console.log('PG_ROWS:' + r.rows[0].count); process.exit(0); }).catch(e => { console.error('PG_ERROR:' + e.message); process.exit(1); });

