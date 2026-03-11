
import pg from 'pg';
import { writeFileSync } from 'fs';

const pool = new pg.Pool({ 
    connectionString: 'postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres', 
    ssl: false 
});

async function exhaustiveAudit() {
    console.log('🚀 Starting EXHAUSTIVE Multi-tenant Audit...');
    
    try {
        // 1. Get all tables in public schema
        const tablesRes = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
        );
        const tables = tablesRes.rows.map(r => r.table_name);
        
        console.log(`📊 Found ${tables.length} tables to audit.\n`);
        
        const results = [];
        const tenantIdentifiers = ['tenant_id', 'company_slug', 'client_id', 'company_id', 'user_id'];

        for (const table of tables) {
            const colsRes = await pool.query(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
                [table]
            );
            const columns = colsRes.rows.map(r => r.column_name);
            
            const foundIdentifiers = tenantIdentifiers.filter(id => columns.includes(id));
            const isIsolated = foundIdentifiers.length > 0;
            
            results.push({
                table,
                isIsolated,
                identifiers: foundIdentifiers,
                allColumns: columns
            });
        }

        const isolated = results.filter(r => r.isIsolated);
        const nonIsolated = results.filter(r => !r.isIsolated);

        const report = {
            total: tables.length,
            isolatedCount: isolated.length,
            nonIsolatedCount: nonIsolated.length,
            isolated,
            nonIsolated
        };
        
        writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to audit_report.json`);
        console.log(`Isolated: ${isolated.length}`);
        console.log(`Non-Isolated: ${nonIsolated.length}`);

    } catch (err) {
        console.error('❌ Audit failed:', err.message);
    } finally {
        await pool.end();
    }
}

exhaustiveAudit();
