import pg from 'pg';
import crypto from 'crypto';

const ENC_KEYBuffer = Buffer.from('c3PJEj6OdmRNaWR4DPNgPTttB6gWG0DfnkmKmzEuT+4=', 'base64');

export function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  
  try {
    const parts = text.split(':');
    if (parts.length !== 3) {
      return text;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEYBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return text;
  }
}

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres'
});

async function run() {
  const result = await pool.query('SELECT tenant_id, supabase_url FROM supabase_config');
  result.rows.forEach(row => {
    console.log(`Tenant: ${row.tenant_id} -> URL: ${decrypt(row.supabase_url)}`);
  });
  process.exit(0);
}

run();
