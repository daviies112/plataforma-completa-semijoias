import pg from 'pg';
import crypto from 'crypto';
import 'dotenv/config';

const ENC_KEYBuffer = Buffer.from('c3PJEj6OdmRNaWR4DPNgPTttB6gWG0DfnkmKmzEuT+4=', 'base64');

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEYBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres'
});

async function run() {
  const localUrl = 'http://103.199.187.145:8100';
  const localKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwOTM5NjkwLCJleHAiOjIwODYyOTk2OTB9.wr0LSRqe7LmvQLp7z1sHrGolTBd8fVIc3LPZMg0fTTI';

  const encryptedUrl = encrypt(localUrl);
  const encryptedKey = encrypt(localKey);

  await pool.query('UPDATE supabase_config SET supabase_url = $1, supabase_anon_key = $2', [encryptedUrl, encryptedKey]);
  
  console.log('✅ Updated all tenants in supabase_config to point to Supabase Local!');
  process.exit(0);
}

run();
