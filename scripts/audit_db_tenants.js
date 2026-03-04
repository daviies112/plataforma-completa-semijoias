
import pg from 'pg';
const pool = new pg.Pool({ 
    connectionString: 'postgresql://postgres:6RdcZumfl2RB9CyHFdLM5u5uObswYnDv@103.199.187.145:54322/postgres', 
    ssl: false 
});

async function auditColumns() {
    const criticalTables = [
        'reunioes', 'forms', 'clientes_completos', 'leads', 
        'order_items', 'products', 'app_settings', 'company_settings',
        'chats', 'boletos', 'files', 'formulario_cliente'
    ];
    
    console.log('--- Multi-tenant Column Audit ---');
    
    try {
        for (const table of criticalTables) {
            const res = await pool.query(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
                [table]
            );
            const columns = res.rows.map(r => r.column_name);
            const hasTenantId = columns.includes('tenant_id');
            const hasCompanySlug = columns.includes('company_slug');
            
            console.log(`Table: ${table}`);
            console.log(`- tenant_id: ${hasTenantId ? '✅' : '❌'}`);
            console.log(`- company_slug: ${hasCompanySlug ? '✅' : '❌'}`);
            if (!hasTenantId && !hasCompanySlug) {
                console.warn(`⚠️ WARNING: Table ${table} lacks tenant identifier!`);
                console.log(`  Columns found: ${columns.join(', ')}`);
            }
        }
    } catch (err) {
        console.error('Audit failed:', err.message);
    } finally {
        await pool.end();
    }
}

auditColumns();
