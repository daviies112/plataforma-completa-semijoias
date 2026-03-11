
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/nexus?sslmode=disable' });
const hash = "$2a$10$zivjpSymBc8CwFawyGTDtOJSle/QcrUz0aizfHsZSmWQ5slSxa9gq";
pool.query(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text,
    name text,
    company_name text,
    tenant_id text,
    role text DEFAULT 'admin',
    is_active boolean DEFAULT true,
    last_login timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  );
`).then(() => pool.query("INSERT INTO admin_users (email, password_hash, name, tenant_id, is_active) VALUES ('contato@emericks.com.br', $1, 'Gabriel Emerick', 'emerick', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING *", [hash]))
.then(res => { console.log('✅ Host DB synced for fallback!'); pool.end(); })
.catch(e => { console.error('Host Error:', e); pool.end(); });
