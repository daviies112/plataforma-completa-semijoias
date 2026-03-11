
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query("SELECT * FROM admin_users WHERE email = 'contato@emericks.com.br' AND is_active = true LIMIT 1")
    .then(res => {
         console.log(res.rows[0]);
         pool.end();
    })
    .catch(err => {
         console.error(err);
         pool.end();
    });
