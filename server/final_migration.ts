import pkg from 'pg';
const { Client } = pkg;

const sql = `
create table if not exists public.admin_supabase_credentials (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  project_name text null,
  supabase_url text not null,
  supabase_anon_key text not null,
  supabase_service_role_key text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint admin_supabase_credentials_pkey primary key (id)
);

create table if not exists public.admin_users (
  id uuid not null default gen_random_uuid (),
  email character varying(255) not null,
  password_hash character varying(255) not null,
  name character varying(255) not null,
  role character varying(50) null default 'admin'::character varying,
  company_name character varying(255) null,
  company_email character varying(255) null,
  plan_type character varying(50) null default 'pro'::character varying,
  tenant_id character varying(100) null,
  is_active boolean null default true,
  last_login timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint admin_users_pkey primary key (id),
  constraint admin_users_email_key unique (email)
);

create index if not exists idx_admin_users_email_v2 on public.admin_users using btree (email);
create index if not exists idx_admin_users_tenant_v2 on public.admin_users using btree (tenant_id);

create table if not exists public.revendedoras (
  id uuid not null default gen_random_uuid (),
  admin_id uuid not null,
  nome text not null,
  email text not null,
  cpf text not null,
  status text null default 'ativo'::text,
  senha_hash text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  telefone text null,
  comissao_padrao numeric null default 10,
  stripe_account_id text null,
  updated_at timestamp with time zone null default now(),
  constraint revendedoras_pkey primary key (id),
  constraint revendedoras_cpf_key unique (cpf),
  constraint revendedoras_email_key unique (email)
);

create index if not exists idx_revendedoras_email_v2 on public.revendedoras using btree (email);
create index if not exists idx_revendedoras_cpf_v2 on public.revendedoras using btree (cpf);
`;

async function runFinalMigration() {
  const connectionString = "postgresql://postgres:230723Davi%23b@103.199.187.145:5432/db_cliente_plataforma?sslmode=disable";
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('✅ Connected to db_cliente_plataforma');
    await client.query(sql);
    console.log('✅ Final Migration Success: Tables created in Supabase backend');
    
    // Inserir usuário de teste novamente no banco correto
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash('admin123', 10);
    await client.query(`
      INSERT INTO admin_users (email, password_hash, name, role, company_name, plan_type, tenant_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@nexus.tech', passwordHash, 'Admin Global', 'admin', 'Nexus Intelligence', 'pro', 'dev-admin_nexus_tech', true]);
    console.log('✅ Test user admin@nexus.tech / admin123 created');
    
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

runFinalMigration();
