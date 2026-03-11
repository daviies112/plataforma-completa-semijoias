
const fs = require('fs');
const path = require('path');

function findAdminUsersTable(dir) {
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist')) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findAdminUsersTable(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("pgTable('admin_users") || content.includes('pgTable("admin_users"')) {
                console.log('FOUND IN:', fullPath);
            }
        }
    }
}

findAdminUsersTable('/var/www/plataformacompleta');
