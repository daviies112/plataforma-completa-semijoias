import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { decrypt } = await import('./server/lib/credentialsManager.js');
  const { db } = await import('./server/db.js');
  const { supabaseConfig } = await import('./shared/db-schema.js');

  try {
    const configs = await db.select().from(supabaseConfig).limit(1);
    if (configs[0]) {
      console.log('Encrypted URL:', configs[0].supabaseUrl);
      
      try {
        const decryptedUrl = decrypt(configs[0].supabaseUrl);
        const decryptedKey = decrypt(configs[0].supabaseAnonKey);
        console.log('Decrypted URL:', decryptedUrl);
        console.log('Decrypted Key (first 10 chars):', decryptedKey.substring(0, 10));
      } catch (e) {
        console.error('Decryption failed:', e.message);
      }
    } else {
      console.log('No supabase_config found');
    }
  } catch (err) {
    console.error('DB Error:', err);
  }
}

run();
