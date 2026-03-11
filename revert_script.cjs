
const fs = require('fs');
const path = '/var/www/plataformacompleta/server/routes/multiTenantAuth.ts';
let content = fs.readFileSync(path, 'utf8');

const oldBlockMatcher = /const \{ Pool \} = require\('pg'\);[\s\S]*?if \(false\) \{/g;

const newBlock = `const adminUsersTable = (schema as any).adminUsers;
      if (true) {`;

if(content.match(oldBlockMatcher)) {
   content = content.replace(oldBlockMatcher, newBlock);
   fs.writeFileSync(path, content);
   console.log('Restored multiTenantAuth.ts!');
} else {
   console.log('Could not find the patched block.');
}
