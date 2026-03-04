import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { encrypt, decrypt } = await import('./server/lib/credentialsManager.js');
  const { db } = await import('./server/db.js');
  const { supabaseConfig, hms100msConfig, evolutionApiConfig, totalExpressConfig, redisConfig, sentryConfig, cloudflareConfig, betterStackConfig } = await import('./shared/db-schema.js');
  const { eq, or } = await import('drizzle-orm');

  try {
    console.log('--- FIXING SUPABASE URL ---');
    const sConfigs = await db.select().from(supabaseConfig);
    for (const config of sConfigs) {
      try {
        const decryptedUrl = decrypt(config.supabaseUrl);
        if (decryptedUrl.endsWith('/rest/v1')) {
          const fixedUrl = decryptedUrl.replace('/rest/v1', '');
          const encryptedFixedUrl = encrypt(fixedUrl);
          await db.update(supabaseConfig)
            .set({ supabaseUrl: encryptedFixedUrl })
            .where(eq(supabaseConfig.id, config.id));
          console.log(`✅ Fixed Supabase URL for ID ${config.id}: ${fixedUrl}`);
        } else {
          console.log(`ℹ️ Supabase URL for ID ${config.id} already correct: ${decryptedUrl}`);
        }
      } catch (e) {
        console.error(`❌ Decryption failed for Supabase config ${config.id}:`, e.message);
      }
    }

    console.log('\n--- CLEANING EMPTY STRINGS IN CONFIG TABLES ---');
    
    const tables = [
      { name: 'hms100msConfig', schema: hms100msConfig, cols: ['appAccessKey', 'appSecret', 'managementToken'] },
      { name: 'evolutionApiConfig', schema: evolutionApiConfig, cols: ['apiKey'] },
      { name: 'totalExpressConfig', schema: totalExpressConfig, cols: ['password'] },
      { name: 'redisConfig', schema: redisConfig, cols: ['redisUrl', 'redisToken'] },
      { name: 'sentryConfig', schema: sentryConfig, cols: ['dsn', 'authToken'] },
      { name: 'cloudflareConfig', schema: cloudflareConfig, cols: ['zoneId', 'apiToken'] },
      { name: 'betterStackConfig', schema: betterStackConfig, cols: ['sourceToken'] }
    ];

    for (const tableInfo of tables) {
      const rows = await db.select().from(tableInfo.schema);
      for (const row of rows) {
        const updates: any = {};
        let needsUpdate = false;
        
        for (const col of tableInfo.cols) {
          if (row[col] === "") {
            updates[col] = null;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await db.update(tableInfo.schema)
            .set(updates)
            .where(eq(tableInfo.schema.id, row.id));
          console.log(`✅ Cleaned up empty strings in ${tableInfo.name} for ID ${row.id}`);
        }
      }
    }

    console.log('\n--- ALL FIXES COMPLETED ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Critical Error:', err);
    process.exit(1);
  }
}

run();
