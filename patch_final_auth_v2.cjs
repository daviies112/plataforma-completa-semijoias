
const fs = require('fs');
const path = '/var/www/plataformacompleta/server/routes/multiTenantAuth.ts';

let content = fs.readFileSync(path, 'utf8');

// The block we want to replace
const startMarker = "try {";
const drizzleMarker = "const { db } = await import('../db');";
const endMarker = "console.error('[AUTH] Local DB query failed', e);";

// More robust replacement
const searchString = content.substring(content.indexOf(drizzleMarker) - 6, content.indexOf(endMarker) + endMarker.length + 5);

const rawSqlFallback = "try {\n      const { pool } = await import('../db');\n      console.log('🔍 [AUTH] Tentando via Host Postgres (raw SQL) para:', email);\n      \n      const resPg = await pool.query(\n        'SELECT * FROM admin_users WHERE email = $1 AND is_active = true LIMIT 1',\n        [email]\n      );\n      \n      if (resPg.rows.length > 0) {\n        const localUser = resPg.rows[0];\n        adminData = {\n          ...localUser,\n          nome: localUser.name || localUser.nome || localUser.company_name,\n          password_hash: localUser.password_hash || localUser.passwordHash,\n          company_name: localUser.company_name || localUser.companyName,\n          tenant_id: localUser.tenant_id || localUser.tenantId,\n          is_active: localUser.is_active || localUser.isActive,\n          role: localUser.role || 'admin',\n          id: localUser.id\n        };\n        console.log('✅ [AUTH] Local DB user found via raw SQL no Host!');\n      } else {\n        console.log('⚠️ [AUTH] Usuário não encontrado no Host DB (raw SQL).');\n      }\n    } catch (e) {\n      console.error('[AUTH] Local DB query failed', e);\n    }";

if (content.includes(drizzleMarker)) {
    // We will use a simpler replace by finding the start of the try block and end of the catch block
    const startIndex = content.indexOf("try {", content.indexOf("Login via banco de dados local"));
    const endIndex = content.indexOf("}", startIndex + 5); // Simple find next } - but wait, this might be too simple
    
    // Let's use string manipulation to find the balanced closing brace if possible, 
    // or just regex if it's unique enough.
}

// Rewriting totally to avoid regex issues
const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;

for(let i=0; i<lines.length; i++) {
    if(lines[i].includes("Login via banco de dados local")) {
        // Start looking for the try block after this line
        for(let j=i; j<lines.length; j++) {
            if(lines[j].includes("try {")) {
                startIdx = j;
                break;
            }
        }
    }
    if(startIdx !== -1 && lines[i].includes("console.error('[AUTH] Local DB query failed', e);")) {
        // Find the next } line
        for(let j=i; j<lines.length; j++) {
            if(lines[j].trim() === "}") {
                endIdx = j;
                break;
            }
        }
        break;
    }
}

if(startIdx !== -1 && endIdx !== -1) {
    const newLines = [
        ...lines.slice(0, startIdx),
        rawSqlFallback,
        ...lines.slice(endIdx + 1)
    ];
    fs.writeFileSync(path, newLines.join('\n'));
    console.log('Patch successfully applied to multiTenantAuth.ts via Line Parser!');
} else {
    console.error('Line markers not found!');
}
