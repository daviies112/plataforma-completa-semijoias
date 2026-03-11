import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { whatsappLabels } from '../../../shared/db-schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initFromSeed() {
  try {
    console.log('🌱 Iniciando configuração a partir do seed-data.json...');
    
    // Lê o arquivo seed-data.json
    const seedFilePath = path.join(__dirname, '../../seed-data.json');
    const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
    
    console.log('📄 Arquivo seed-data.json lido com sucesso');
    
    // Verifica se já existem etiquetas
    const existingLabels = await db.select().from(whatsappLabels).limit(1);
    
    if (existingLabels.length > 0) {
      console.log('⚠️  Etiquetas já existem no banco de dados');
      console.log('   Use a API /api/whatsapp/labels/reset para resetar se necessário');
      return;
    }
    
    // Insere etiquetas do seed
    console.log(`🏷️  Inserindo ${seedData.whatsapp_labels.length} etiquetas padrão...`);
    
    for (const label of seedData.whatsapp_labels) {
      await db.insert(whatsappLabels).values({
        nome: label.nome,
        cor: label.cor,
        formStatus: label.formStatus,
        qualificationStatus: label.qualificationStatus,
        ordem: label.ordem,
        ativo: label.ativo
      });
      console.log(`   ✓ ${label.nome} (${label.cor})`);
    }
    
    console.log('✅ Configuração concluída com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Inicie o servidor: npm run dev');
    console.log('   2. (Opcional) Configure SUPABASE_URL e SUPABASE_ANON_KEY');
    console.log('   3. (Opcional) Sincronize dados do Supabase:');
    console.log('      curl -X POST http://localhost:5000/api/leads/sync-from-supabase');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar a partir do seed:', error);
    process.exit(1);
  }
}

// Executa a inicialização
initFromSeed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
