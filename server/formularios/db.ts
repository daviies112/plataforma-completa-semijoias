/**
 * Formularios Database Connection
 * 
 * SUPABASE-ONLY MODE:
 * Uses the same configuration system as server/db.ts
 * Supports running without database in "configuration mode"
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "../../shared/db-schema";
import { getDatabaseUrl } from "../lib/supabaseFileConfig";

let pool: pg.Pool | null = null;
let internalDb: ReturnType<typeof drizzle> | null = null;
let connectionAttempted = false;

function initializeDatabase(): void {
  if (connectionAttempted) return;
  connectionAttempted = true;
  
  const databaseUrl = getDatabaseUrl();
  
  if (databaseUrl) {
    try {
      pool = new pg.Pool({ 
        connectionString: databaseUrl,
        max: 10,
        connectionTimeoutMillis: 10000
      });
      internalDb = drizzle(pool, { schema });
      console.log('✅ Formulários database connection configured');
    } catch (error) {
      console.warn('⚠️  Formulários database connection failed:', error);
      pool = null;
      internalDb = null;
    }
  } else {
    console.log('ℹ️  Formulários: Aguardando configuração do Supabase');
  }
}

initializeDatabase();

// Export a guaranteed db object to avoid type errors in other files
export const db = drizzle(pool as any, { schema }) as unknown as ReturnType<typeof drizzle<typeof schema>>;
export { pool };
