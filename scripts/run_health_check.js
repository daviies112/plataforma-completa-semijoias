import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
}
const client = new pg.Client({ connectionString, ssl: false });

async function runHealthCheck() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync('c:\\Users\\davie\\Downloads\\Skill e mcp\\multitenant_id\\06_health_check.sql', 'utf8');
        const statements = sql
            .split(/-- -{63}\r?\n-- \d+\..*?\r?\n-- -{63}\r?\n/g)
            .filter(stmt => stmt.trim().length > 0 && !stmt.startsWith('-- ='));

        const stepNames = [
            "1. VERIFICAR: tabelas SEM tenant_id",
            "2. VERIFICAR: tabelas de revendedora SEM revendedora_id",
            "3. VERIFICAR: tabelas SEM RLS ativo",
            "4. VERIFICAR: dados órfãos",
            "5. RELATÓRIO GERAL: contagem por tenant",
            "6. VERIFICAR: instâncias Evolution com nome incorreto",
            "7. ÍNDICES: verificar índices compostos",
            "8. RESUMO EXECUTIVO"
        ];

        let i = 0;
        for (const statement of statements) {
            console.log(`\n\n--- Executing Step: ${stepNames[i] || 'Query'} ---`);
            try {
                // If it's a DO block, it doesn't return rows in the same way
                if (statement.trim().toUpperCase().startsWith('DO $$')) {
                    await client.query(statement);
                    console.log('✅ PL/pgSQL block executed successfully.');
                } else {
                    const result = await client.query(statement);
                    if (result.rows && result.rows.length > 0) {
                        console.table(result.rows);
                    } else {
                        console.log('✅ No issues found / 0 rows returned.');
                    }
                }
            } catch (err) {
                console.error(`❌ Error executing query:`, err.message);
                console.error(`Query was:\n${statement.substring(0, 100)}...`);
            }
            i++;
        }
    } catch (err) {
        console.error('❌ Connection error:', err.message);
    } finally {
        await client.end();
    }
}

runHealthCheck();
