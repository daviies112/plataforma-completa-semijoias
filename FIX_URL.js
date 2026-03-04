
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_LOCAL_URL;
const supabaseKey = process.env.SUPABASE_LOCAL_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais de banco não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('🔄 Iniciando limpeza de URL no Supabase...');
  
  // Limpar a URL antiga para forçar o sistema a regenerar
  const { error: err1 } = await supabase
    .from('app_settings')
    .update({ 
      active_form_url: null, 
      active_form_id: '0a3514bb-75cc-47cf-81cd-7994724b126d' 
    })
    .eq('id', 1);

  if (err1) {
    console.error('❌ Erro ao atualizar app_settings:', err1.message);
  } else {
    console.log('✅ app_settings: URL antiga removida com sucesso!');
  }

  // Marcar o formulário como público
  const { error: err2 } = await supabase
    .from('form_tenant_mapping')
    .update({ 
      is_public: true, 
      slug: 'gabriel',
      company_slug: 'emericks'
    })
    .eq('form_id', '0a3514bb-75cc-47cf-81cd-7994724b126d');

  if (err2) {
    console.error('❌ Erro ao atualizar form_tenant_mapping:', err2.message);
  } else {
    console.log('✅ form_tenant_mapping: Formulário Gabriel configurado como público!');
  }
}

fix();
