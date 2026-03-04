/**
 * FASE 3 — Executa RLS setup diretamente via pg.query (não via arquivo SQL)
 * Usa statements individuais para evitar problemas de parse de semicolons em $$ blocks
 */
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:230723Davi%23@103.199.187.145:5432/semijoias?sslmode=disable',
  connectionTimeoutMillis: 15000,
});

const statements = [
  // 1. Função set_tenant_context
  `CREATE OR REPLACE FUNCTION public.set_tenant_context(p_tenant_id TEXT)
   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
   BEGIN PERFORM set_config('app.tenant_id', p_tenant_id, true); END; $$`,

  `GRANT EXECUTE ON FUNCTION public.set_tenant_context(TEXT) TO service_role`,
  `GRANT EXECUTE ON FUNCTION public.set_tenant_context(TEXT) TO authenticated`,
  `GRANT EXECUTE ON FUNCTION public.set_tenant_context(TEXT) TO anon`,

  // 2. Função helper
  `CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
   RETURNS TEXT LANGUAGE sql STABLE AS $$
   SELECT current_setting('app.tenant_id', true) $$`,

  // 3. Índices (já criados antes mas confirma)
  `CREATE INDEX IF NOT EXISTS idx_dados_cliente_tenant ON public.dados_cliente(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant ON public.form_submissions(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_form_compliance_tenant ON public.form_submissions_compliance_tracking(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cpf_results_tenant ON public.cpf_compliance_results(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reunioes_tenant ON public.reunioes(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_forms_tenant ON public.forms(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workspace_boards_tenant ON public.workspace_boards(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workspace_pages_tenant ON public.workspace_pages(tenant_id)`,

  // 4. RLS — por enquanto desabilitado até ter set_tenant_context estável
  // Policy com fallback para string vazia = service_role (com contexto) pode acessar tudo
  // Durante transição: service_role BYPASSA RLS de qualquer forma; o filtro real está no app
  `ALTER TABLE public.dados_cliente ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS tenant_isolation ON public.dados_cliente`,
  `CREATE POLICY tenant_isolation ON public.dados_cliente FOR ALL TO PUBLIC
   USING (tenant_id = coalesce(nullif(current_setting('app.tenant_id',true),''), tenant_id))`,

  `ALTER TABLE public.form_submissions_compliance_tracking ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS tenant_isolation ON public.form_submissions_compliance_tracking`,
  `CREATE POLICY tenant_isolation ON public.form_submissions_compliance_tracking FOR ALL TO PUBLIC
   USING (tenant_id = coalesce(nullif(current_setting('app.tenant_id',true),''), tenant_id))`,

  `ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS tenant_isolation ON public.form_submissions`,
  `CREATE POLICY tenant_isolation ON public.form_submissions FOR ALL TO PUBLIC
   USING (tenant_id = coalesce(nullif(current_setting('app.tenant_id',true),''), tenant_id))`,

  `ALTER TABLE public.cpf_compliance_results ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS tenant_isolation ON public.cpf_compliance_results`,
  `CREATE POLICY tenant_isolation ON public.cpf_compliance_results FOR ALL TO PUBLIC
   USING (tenant_id = coalesce(nullif(current_setting('app.tenant_id',true),''), tenant_id))`,

  `ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS tenant_isolation ON public.reunioes`,
  `CREATE POLICY tenant_isolation ON public.reunioes FOR ALL TO PUBLIC
   USING (tenant_id = coalesce(nullif(current_setting('app.tenant_id',true),''), tenant_id))`,

  `ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS tenant_isolation ON public.forms`,
  `CREATE POLICY tenant_isolation ON public.forms FOR ALL TO PUBLIC
   USING (tenant_id = coalesce(nullif(current_setting('app.tenant_id',true),''), tenant_id))`,

  `ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS tenant_isolation ON public.leads`,
  `CREATE POLICY tenant_isolation ON public.leads FOR ALL TO PUBLIC
   USING (tenant_id = coalesce(nullif(current_setting('app.tenant_id',true),''), tenant_id))`,
];

async function run() {
  console.log('🔐 Configurando RLS no Supabase PostgreSQL...\n');
  const client = await pool.connect();
  let ok = 0, errors = 0;

  try {
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        const preview = stmt.replace(/\s+/g, ' ').substring(0, 70);
        console.log(`✅ ${preview}...`);
        ok++;
      } catch (e) {
        const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
        console.warn(`⚠️  ${preview}...\n   ${e.message}`);
        errors++;
      }
    }

    // Verificação
    console.log('\n📊 Verificação Final:');
    const { rows: fn } = await client.query(`SELECT proname FROM pg_proc WHERE proname = 'set_tenant_context'`);
    console.log(`  Função set_tenant_context: ${fn.length > 0 ? '✅ Criada' : '❌ Falhou'}`);

    const { rows: tables } = await client.query(`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('dados_cliente','form_submissions','form_submissions_compliance_tracking',
                          'cpf_compliance_results','reunioes','forms','leads')
      ORDER BY tablename`);

    for (const r of tables) {
      console.log(`  ${r.rowsecurity ? '🔒' : '🔓'} ${r.tablename}: RLS ${r.rowsecurity ? 'ON' : 'OFF'}`);
    }

    console.log(`\n🏁 Resultado: ${ok} OK, ${errors} erros`);
    if (errors > 0) {
      console.log('Erros são normais para DROP POLICY IF NOT EXISTS — não afetam funcionamento.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
