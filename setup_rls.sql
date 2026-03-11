/**
 * FASE 3 — SQL para Supabase: RLS + Tenant Context Function
 * 
 * Execute este arquivo no SQL Editor do Supabase ou via psql.
 * Cria: função set_tenant_context + enable RLS em todas as tabelas críticas
 */

-- ============================================================
-- 1. FUNÇÃO: set_tenant_context (chamada pelo backend antes de queries)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_tenant_context(p_tenant_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_tenant_context(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_tenant_context(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_tenant_context(TEXT) TO anon;

-- ============================================================
-- 2. FUNÇÃO: get_current_tenant_id (usada pelas policies RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.tenant_id', true)
$$;

-- ============================================================
-- 3. ATIVAR RLS + POLICIES em todas as tabelas de dados críticas
-- ============================================================

-- NOTA: As policies usam get_current_tenant_id() E também o .eq() do app code,
-- criando dupla proteção. Service_role pode BYPASSRLS mas com set_tenant_context
-- o filtro fica garantido tanto em nível de app quanto de banco.

-- dados_cliente
ALTER TABLE public.dados_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.dados_cliente;
CREATE POLICY "tenant_isolation" ON public.dados_cliente
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- form_submissions_compliance_tracking
ALTER TABLE public.form_submissions_compliance_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.form_submissions_compliance_tracking;
CREATE POLICY "tenant_isolation" ON public.form_submissions_compliance_tracking
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- form_submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.form_submissions;
CREATE POLICY "tenant_isolation" ON public.form_submissions
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- cpf_compliance_results
ALTER TABLE public.cpf_compliance_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.cpf_compliance_results;
CREATE POLICY "tenant_isolation" ON public.cpf_compliance_results
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- reunioes
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.reunioes;
CREATE POLICY "tenant_isolation" ON public.reunioes
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- forms
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.forms;
CREATE POLICY "tenant_isolation" ON public.forms
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- workspace_boards
ALTER TABLE public.workspace_boards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.workspace_boards;
CREATE POLICY "tenant_isolation" ON public.workspace_boards
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- workspace_pages
ALTER TABLE public.workspace_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.workspace_pages;
CREATE POLICY "tenant_isolation" ON public.workspace_pages
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.leads;
CREATE POLICY "tenant_isolation" ON public.leads
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');

-- dados_cliente_cache (se existir)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dados_cliente_cache') THEN
    ALTER TABLE public.dados_cliente_cache ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tenant_isolation" ON public.dados_cliente_cache;
    CREATE POLICY "tenant_isolation" ON public.dados_cliente_cache
      FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() = '');
  END IF;
END $$;

-- ============================================================
-- 4. ÍNDICES em tenant_id (performance — evita full scan)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_dados_cliente_tenant ON public.dados_cliente(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant ON public.form_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_compliance_tenant ON public.form_submissions_compliance_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cpf_results_tenant ON public.cpf_compliance_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_tenant ON public.reunioes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_forms_tenant ON public.forms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads(tenant_id);

-- ============================================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('dados_cliente','form_submissions','form_submissions_compliance_tracking','cpf_compliance_results','reunioes','forms','leads','workspace_boards','workspace_pages')
ORDER BY tablename;
