
import { createClient } from '@supabase/supabase-js';

const meetingId = '28e47a33-bcd3-4d71-878b-c18ce452b37e';

async function check(name, url, key) {
    if (!url || !key) return;
    console.log(`Checking ${name} at ${url}...`);
    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('reunioes').select('id, titulo').or(`id.eq.${meetingId},room_id_100ms.eq.${meetingId}`).maybeSingle();
        if (data) {
            console.log(`✅ FOUND in ${name}:`, data);
        } else {
            console.log(`- Not found in ${name}`);
        }
    } catch (e) {
        console.log(`Error in ${name}: ${e.message}`);
    }
}

async function run() {
    // SYSTEM SUPABASE (REPLIT/MAIN)
    await check('SYSTEM', 'https://ivwubfsqgqetayqenmvi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3MDQ1ODU2MDAsImV4cCI6MjAyMDY2NTYwMH0.3_Xxxxxx'); // Note: Service role key should be valid in env
    
    // LOCAL SUPABASE (VPS)
    await check('LOCAL', 'http://103.199.187.145:8100', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwOTM5NjkwLCJleHAiOjIwODYyOTk2OTB9.wr0LSRqe7LmvQLp7z1sHrGolTBd8fVIc3LPZMg0fTTI');

    console.log('Search finished.');
}

run();
