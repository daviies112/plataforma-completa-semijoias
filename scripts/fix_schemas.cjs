const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Encontrar todas as instâncias de createInsertSchema(...)
  // e remover a chamada .omit({...}) que vem logo depois dela
  
  const regex = /(createInsertSchema\([a-zA-Z0-9_]+\))\.omit\(\{\s*id:\s*true(?:,\s*[a-zA-Z_]+:\s*true)*\s*,?\s*\}\)/g;
  
  content = content.replace(regex, '$1');
  
  // Tratar os casos que têm chaves específicas (ex: createdAtWhatsapp)
  const regex2 = /(createInsertSchema\([a-zA-Z0-9_]+\))\.omit\(\{[\s\S]*?\}\)/g;
  
  content = content.replace(regex2, '$1');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed ${filePath}`);
}

fixFile(path.join(__dirname, '../shared/db-schema.ts'));
fixFile(path.join(__dirname, '../shared/formularios/schema.ts'));
