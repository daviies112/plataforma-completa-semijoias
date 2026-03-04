
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
  const { db } = await import('./server/db');
  const { wallets } = await import('./shared/db-schema');
  const { eq } = await import('drizzle-orm');
  
  const tenantId = 'emericks-tenant';
  console.log('Testing db.select for tenant:', tenantId);
  
  try {
    const existing = await db!.select().from(wallets).where(eq(wallets.tenantId, tenantId)).limit(1);
    console.log('Existing wallet search:', existing);
    
    if (existing.length === 0) {
      console.log('Creating new wallet...');
      const [newWallet] = await db.insert(wallets).values({
        tenantId,
        balance: "0.00",
        currency: "BRL",
      }).returning();
      console.log('Created wallet:', newWallet);
    }
  } catch (error: any) {
    console.error('❌ Error in getOrCreateWallet logic:', error);
    if (error.stack) console.error(error.stack);
  }
  process.exit(0);
}

main();
