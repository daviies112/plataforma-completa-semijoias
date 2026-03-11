import pg from 'pg';
import crypto from 'crypto';

const ENC_KEY = 'c3PJEj6OdmRNaWR4DPNgPTttB6gWG0DfnkmKmzEuT+4=';

function decrypt(text) {
  if (!text) return text;
  if (!text.includes(':')) return text;
  
  try {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    // Convert base64 key to buffer
    const key = Buffer.from(ENC_KEY, 'base64');
    
    let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    return text;
  }
}

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres'
});

async function run() {
  const result = await pool.query('SELECT tenant_id, supabase_url, supabase_anon_key FROM supabase_config');
  result.rows.forEach(row => {
    console.log(`Tenant: ${row.tenant_id} -> URL: ${decrypt(row.supabase_url)}`);
    //console.log(`AnonKey: ${decrypt(row.supabase_anon_key)}`);
  });
  process.exit(0);
}

run();
