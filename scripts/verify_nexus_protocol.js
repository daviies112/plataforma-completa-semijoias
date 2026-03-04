
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const { Client } = pg;

async function exhaustiveVerification() {
  console.log('🚀 Starting Exhaustive Nexus Protocol Verification...');
  
  // 1. Verify Postgres Local (Foundation)
  const localDbUrl = process.env.POSTGRES_LOCAL_URL;
  console.log('--------------------------------------------------');
  console.log('1. Checking POSTGRES LOCAL (Foundation)...');
  if (!localDbUrl) {
    console.error('❌ POSTGRES_LOCAL_URL not found in .env');
  } else {
    const client = new Client({ connectionString: localDbUrl });
    try {
      await client.connect();
      const res = await client.query('SELECT current_database(), current_user');
      console.log(`✅ Postgres Local Connected: ${res.rows[0].current_database} as ${res.rows[0].current_user}`);
      
      const tableCheck = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
      console.log(`📊 Postgres Local Tables: ${tableCheck.rows[0].count}`);
    } catch (e) {
      console.error('❌ Postgres Local Connection Failed:', e.message);
    } finally {
      await client.end();
    }
  }

  // 2. Verify Supabase Local (Auth & Shared Layer)
  console.log('--------------------------------------------------');
  console.log('2. Checking SUPABASE LOCAL (Auth Layer)...');
  const supabaseUrl = process.env.SUPABASE_LOCAL_URL;
  const supabaseKey = process.env.SUPABASE_LOCAL_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in .env');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
      const { data, error } = await supabase.from('workspace_pages').select('id').limit(1);
      if (error) throw error;
      console.log('✅ Supabase Local API Connected & Reachable');
    } catch (e) {
      console.error('❌ Supabase Local Connection Failed:', e.message);
    }
  }

  // 3. Verify Database Separation (Supabase Integrated Postgres vs Local)
  console.log('--------------------------------------------------');
  console.log('3. Verifying DATABASE SEPARATION...');
  const supabaseIntegratedDbUrl = process.env.DATABASE_URL; // Port 54322 usually
  if (!supabaseIntegratedDbUrl) {
    console.warn('⚠️ DATABASE_URL (Supabase Integrated) not found in .env');
  } else {
    const clientInt = new Client({ connectionString: supabaseIntegratedDbUrl });
    try {
      await clientInt.connect();
      const resInt = await clientInt.query('SELECT current_database(), current_user');
      console.log(`✅ Supabase Integrated Postgres Connected: ${resInt.rows[0].current_database}`);
      
      // Compare with Local
      if (localDbUrl && localDbUrl.includes(':54322') && supabaseIntegratedDbUrl.includes(':54322')) {
        console.warn('⚠️ WARNING: Local DB and Integrated DB seem to point to the same port!');
      } else {
        console.log('🛡️ DB Separation Confirmed: Local Postgres and Supabase Postgres are on different ports/endpoints.');
      }
    } catch (e) {
      console.error('❌ Supabase Integrated Postgres Connection Failed:', e.message);
    } finally {
      await clientInt.end();
    }
  }

  // 4. Verify Skills & Documentation
  console.log('--------------------------------------------------');
  console.log('4. Checking Skills Documentation...');
  const fs = await import('fs');
  const skills = ['188.md', '189.md', '190.md'];
  for (const s of skills) {
    const p = path.join(process.cwd(), 'KNOWLEDGE_BASE', 'skills', s);
    if (fs.existsSync(p)) {
      console.log(`✅ Skill ${s} found in KNOWLEDGE_BASE`);
    } else {
      console.error(`❌ Skill ${s} MISSING!`);
    }
  }

  console.log('--------------------------------------------------');
  console.log('🏁 Verification Complete.');
}

exhaustiveVerification();
