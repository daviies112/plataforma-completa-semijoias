import { supabaseOwner } from '../server/config/supabaseOwner';

async function checkAdmin() {
  if (!supabaseOwner) {
    console.log('Supabase owner not configured');
    return;
  }
  const { data, error } = await supabaseOwner
    .from('admin_users')
    .select('id, email, company_name, tenant_id')
    .limit(5);
  
  if (error) {
    console.error('Error fetching admin users:', error);
  } else {
    console.log('Admin Users:', JSON.stringify(data, null, 2));
  }
}

checkAdmin();
