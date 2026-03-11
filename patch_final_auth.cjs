
const fs = require('fs');
const path = '/var/www/plataformacompleta/server/routes/multiTenantAuth.ts';

let content = fs.readFileSync(path, 'utf8');

const regex = /try \{\s*const \{ db \} = await import\('\.\.\/db'\);[\s\S]*?console\.error\('\[AUTH\] Local DB query failed', e\);\s*\}/;

const rawSqlFallback = `try {
      const { pool } = await import('../db');
      console.log('🔍 [AUTH] Tentando via Host Postgres (raw SQL) para:', email);
      
      const resPg = await pool.query(
        "SELECT * FROM admin_users WHERE email = $1 AND is_active = true LIMIT 1",
        [email]
      );
      
      if (resPg.rows.length > 0) {
        const localUser = resPg.rows[0];
        adminData = {
          ...localUser,
          nome: localUser.name || localUser.nome || localUser.company_name,
          password_hash: localUser.password_hash || localUser.passwordHash,
          company_name: localUser.company_name || localUser.companyName,
          tenant_id: localUser.tenant_id || localUser.tenantId,
          is_active: localUser.is_active || localUser.isActive,
          role: localUser.role || 'admin',
          id: localUser.id
        };
        console.log(`✅ [AUTH] Local DB user found via raw SQL no Host!`);
      } else {
        console.log(`⚠️ [AUTH] Usuário não encontrado no Host DB (raw SQL).`);
      }
    } catch (e) {
      console.error('[AUTH] Local DB query failed', e);
    }`;

if (content.match(regex)) {
   content = content.replace(regex, rawSqlFallback);
   fs.writeFileSync(path, content);
   console.log('Patch successfully applied to multiTenantAuth.ts!');
} else {
   console.error('Regex pattern not found in multiTenantAuth.ts!');
   // Fallback: replace the Drizzle block directly if regex failed
   const backupRegex = /try \{\s*const \{ db \} = await import\('\.\.\/db'\);[\s\S]*?catch \(e\) \{/;
   if (content.match(backupRegex)) {
        console.log('Using backup regex...');
        // We need an alternative approach to replace it gracefully
   }
}
