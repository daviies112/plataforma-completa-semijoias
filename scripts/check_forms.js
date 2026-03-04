
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';

dotenv.config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function decrypt(text) {
  try {
    const [iv, authTag, encryptedText] = text.split(':');
    const key = Buffer.from(process.env.CREDENTIALS_ENCRYPTION_KEY_BASE64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('Decryption failed:', e.message);
    return text; // Return original if not encrypted
  }
}

async function run() {
  try {
    const res = await pool.query("SELECT * FROM supabase_config WHERE tenant_id = 'emericks-tenant'");
    if (res.rows.length === 0) {
      console.log('No config for emericks-tenant');
      return;
    }

    const config = res.rows[0];
    const url = decrypt(config.supabase_url);
    const key = decrypt(config.supabase_anon_key);

    console.log('Using URL:', url);
    console.log('Using Key:', key.substring(0, 20) + '...');

    const supabase = createClient(url, key);

    console.log('Fetching forms...');
    const { data: forms, error } = await supabase.from('forms').select('*');

    if (error) {
      console.error('Error fetching forms:', error);
    } else {
      console.log(`Found ${forms.length} forms:`);
      forms.forEach(f => console.log(`- [${f.id}] ${f.title} (slug: ${f.slug})`));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
