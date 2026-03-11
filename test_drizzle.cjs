
require('dotenv').config();
const { db } = require('./server/db');
const schema = require('./shared/db-schema');
const { eq } = require('drizzle-orm');

(async () => {
    try {
        const adminUsersTable = schema.adminUsers || schema.default?.adminUsers;
        if (!adminUsersTable) {
            console.error('adminUsersTable not found in schema');
            process.exit(1);
        }
        console.log('Got adminUsersTable:', !!adminUsersTable);
        const [localUser] = await db.select().from(adminUsersTable)
           .where(eq(adminUsersTable.email, 'contato@emericks.com.br'))
           .limit(1);
        console.log('Drizzle result:', localUser);
    } catch(e) {
        console.error('Drizzle Error:', e);
    }
    process.exit(0);
})();
