import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';

const ENC_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-for-development-only';

function decrypt(text) {
  if (!text) return text;
  if (!text.includes(':')) return text;
  
  try {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift()!, 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const key = crypto.createHash('sha256').update(String(ENC_KEY)).digest('base64').substring(0, 32);
    
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    return text;
  }
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const result = await pool.query('SELECT tenant_id, supabase_url FROM supabase_config');
  result.rows.forEach(row => {
    console.log(`Tenant: ${row.tenant_id} -> URL: ${decrypt(row.supabase_url)}`);
  });
  process.exit(0);
}

run();
