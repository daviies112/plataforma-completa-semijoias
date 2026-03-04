import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { leads, dadosCliente } from '../../shared/db-schema';
import { eq, and, sql } from 'drizzle-orm';
import { getClientSupabaseClientStrict } from '../lib/multiTenantSupabase';
import { aggregateLeadJourneys, LeadJourney } from '../lib/leadJourneyAggregator';
import { getTenantLookupList } from '../lib/tenantUtils';
import { normalizePhone } from '../formularios/utils/phoneNormalizer.js';

const router = express.Router();

// In-memory cache for leads data to avoid long Supabase fetches on every request
// This prevents browser timeouts in Replit's proxy environment
interface LeadsCacheEntry {
  data: any[];
  timestamp: number;
  tenantId: string;
}

const leadsCache = new Map<string, LeadsCacheEntry>();
const CACHE_TTL_MS = 15 * 1000; // 15 seconds cache - garante dados frescos no Kanban
const CACHE_WAIT_TIMEOUT_MS = 2000; // ⚡ FIX: Reduced to 2s for fast initial response

// Export function to invalidate cache (used by mutations)
export function invalidateLeadsCache(tenantId?: string) {
  if (tenantId) {
    leadsCache.delete(tenantId);
    console.log(`[LeadsCache] Invalidated cache for tenant: ${tenantId}`);
  } else {
    leadsCache.clear();
    console.log('[LeadsCache] Invalidated all caches');
  }
}

// Background refresh function - non-blocking
// ⚡ FIX: Uses fetchLeadsFromSupabase (fast) as PRIMARY, falls back to aggregateLeadJourneys
async function refreshLeadsCacheBackground(tenantId: string) {
  try {
    console.log(`[LeadsCache] Background refresh for tenant: ${tenantId}`);
    // ⚡ PRIMARY: Fast direct Supabase query (combines 5 tables in parallel)
    const leads = await fetchLeadsFromSupabase(tenantId);
    
    leadsCache.set(tenantId, {
      data: leads,
      timestamp: Date.now(),
      tenantId
    });
    console.log(`[LeadsCache] Cached ${leads.length} leads for tenant: ${tenantId} via fetchLeadsFromSupabase`);
  } catch (error) {
    console.error(`[LeadsCache] Background refresh failed:`, error);
  }
}

// Track pending refreshes to avoid duplicate fetches
const pendingRefreshes = new Map<string, Promise<void>>();

// Get cached leads or fetch synchronously if cache miss
function getCachedLeads(tenantId: string): { data: any[] | null; isStale: boolean; isPending: boolean } {
  const cached = leadsCache.get(tenantId);
  const isPending = pendingRefreshes.has(tenantId);
  
  if (!cached) {
    return { data: null, isStale: true, isPending };
  }
  
  const age = Date.now() - cached.timestamp;
  const isStale = age > CACHE_TTL_MS;
  
  return { data: cached.data, isStale, isPending };
}

// Wait for pending refresh with timeout
async function waitForPendingRefresh(tenantId: string, timeoutMs: number = CACHE_WAIT_TIMEOUT_MS): Promise<boolean> {
  const pending = pendingRefreshes.get(tenantId);
  if (!pending) return false;
  
  try {
    await Promise.race([
      pending,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
    ]);
    return true; // Refresh completed
  } catch {
    return false; // Timeout
  }
}

// Debug endpoint to test if basic responses work
router.get('/ping', (req, res) => {
  console.log('[LeadsPipeline] PING received');
  res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

// Debug endpoint: testa a conexão Supabase diretamente e conta registros em cada tabela
router.get('/debug/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  console.log(`[Debug] Testando Supabase para tenant: ${tenantId}`);
  
  try {
    const { getCachedSupabaseCredentials } = await import('../lib/publicCache.js');
    const { createClient } = await import('@supabase/supabase-js');
    
    // Apaga cache de credenciais para forçar releitura
    const { invalidateCredentialsCache } = await import('../lib/publicCache.js');
    invalidateCredentialsCache(tenantId);
    
    const creds = await getCachedSupabaseCredentials(tenantId);
    if (!creds) {
      return res.json({ success: false, error: 'Credenciais não encontradas no banco', tenantId });
    }
    
    const supabase = createClient(creds.url, creds.anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const tables = ['dados_cliente', 'form_submissions_compliance_tracking', 'form_submissions', 'cpf_compliance_results', 'reunioes'];
    const counts: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: false })
          .eq('tenant_id', tenantId)
          .limit(3);
        
        counts[table] = {
          count: data?.length || 0,
          error: error?.message || null,
          sample: data?.slice(0, 1) || []
        };
      } catch (e: any) {
        counts[table] = { count: 0, error: e.message };
      }
    }
    
    return res.json({
      success: true,
      tenantId,
      supabaseUrl: creds.url,
      tables: counts
    });
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

const PIPELINE_STAGES = [
  'contato-inicial',
  'formulario-nao-preenchido',
  'formulario-aprovado',
  'formulario-reprovado',
  'cpf-aprovado',
  'cpf-reprovado',
  'reuniao-agendada',
  'reuniao-nao-compareceu',
  'reuniao-completo',
  'assinatura-pendente',
  'revendedora',
  'consultor'
] as const;

type PipelineStage = typeof PIPELINE_STAGES[number];

const updateLeadSchema = z.object({
  pipelineStatus: z.enum(PIPELINE_STAGES).optional(),
  meetingStatus: z.enum(['pending', 'scheduled', 'completed', 'cancelled']).optional(),
  cpfStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  qualificationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  observacoes: z.string().optional(),
  consultorNome: z.string().optional(),
  consultorEmail: z.string().optional(),
  reuniaoData: z.string().optional(),
  reuniaoHora: z.string().optional(),
  reuniaoLocal: z.string().optional(),
  reuniaoTipo: z.enum(['presencial', 'online']).optional(),
  reuniaoLink: z.string().optional(),
  resultadoReuniao: z.enum(['aprovado', 'em_analise', 'recusado']).optional(),
  motivoRecusa: z.string().optional(),
});

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformRowToCamelCase(row: Record<string, any>): Record<string, any> {
  const transformed: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    transformed[snakeToCamel(key)] = row[key];
  }
  return transformed;
}

/**
 * Transform Supabase form_submission to lead format for Kanban display
 * This enables direct Supabase queries when local leads table is empty
 */
function transformSubmissionToLead(submission: any): Record<string, any> {
  // FIX: Robust passed checking - handle boolean, string, and edge cases
  let pipelineStatus = 'contato-inicial';
  const formStatus = submission.form_status || 'completed';
  const passedValue = submission.passed;
  
  // Log for debugging
  console.log(`📋 [transformSubmissionToLead] Submission ${submission.id}: passed=${JSON.stringify(passedValue)} (type: ${typeof passedValue})`);
  
  // Check for rejection: boolean false, string "false", "rejected", "reprovado", or 0
  const isRejected = passedValue === false || 
                     passedValue === 'false' ||
                     passedValue === 'rejected' ||
                     passedValue === 'reprovado' ||
                     passedValue === 0;
  
  // Check for approval: boolean true, string "true", "approved", "aprovado", or 1
  const isApproved = passedValue === true || 
                     passedValue === 'true' ||
                     passedValue === 'approved' ||
                     passedValue === 'aprovado' ||
                     passedValue === 1;
  
  if (isApproved) {
    pipelineStatus = 'formulario-aprovado';
  } else if (isRejected) {
    pipelineStatus = 'formulario-reprovado';
  }
  // If passedValue is undefined/null, stay at contato-inicial (will be handled by formulario_envios)
  
  return {
    id: submission.id,
    // 🔐 SECURITY FIX: Never use 'default-tenant' as fallback - require valid tenant_id
    tenantId: submission.tenant_id || '',
    telefone: submission.contact_phone,
    telefoneNormalizado: submission.contact_phone ? normalizePhone(submission.contact_phone) : '',
    nome: submission.contact_name || 'Sem nome',
    email: submission.contact_email,
    origem: 'formulario',
    formStatus: formStatus,
    qualificationStatus: isApproved ? 'approved' : (isRejected ? 'rejected' : 'pending'),
    statusQualificacao: isApproved ? 'aprovado' : (isRejected ? 'reprovado' : 'pendente'),
    pontuacao: submission.total_score || 0,
    pipelineStatus: pipelineStatus,
    calculatedStage: pipelineStatus,
    formularioId: submission.form_id,
    submissionId: submission.id,
    formularioConcluido: formStatus === 'completed',
    formularioConcluidoEm: formStatus === 'completed' ? submission.updated_at : null,
    formularioAberto: ['opened', 'started', 'completed'].includes(formStatus),
    formularioAbertoEm: ['opened', 'started', 'completed'].includes(formStatus) ? submission.created_at : null,
    cpf: submission.contact_cpf,
    createdAt: submission.created_at,
    updatedAt: submission.updated_at,
  };
}

/**
 * Transform dados_cliente from Supabase to lead format for Kanban display
 * ✅ REGRA: dados_cliente → SEMPRE "Contato Inicial"
 * A coluna de Reunião só é determinada pela tabela SEPARADA "reunioes"
 * O campo reuniao_status em dados_cliente é metadado do contato, não do Kanban
 */
function transformDadosClienteToLead(cliente: any): Record<string, any> {
  // dados_cliente → SEMPRE contato-inicial
  // A tabela "reunioes" (separada) é que determina as colunas de reunião
  const pipelineStatus = 'contato-inicial';
  
  // Priorizar NomeWpp (campo do WhatsApp) sobre nome
  const nome = cliente['NomeWpp'] || cliente['nomewpp'] || cliente.nome || 'Sem nome';
  
  return {
    id: cliente.id,
    tenantId: cliente.tenant_id || '',
    telefone: cliente.telefone,
    telefoneNormalizado: cliente.telefone ? normalizePhone(cliente.telefone) : '',
    nome: nome,
    email: cliente.email,
    origem: 'dados_cliente',
    formStatus: 'not_sent',
    qualificationStatus: 'pending',
    statusQualificacao: 'pendente',
    pontuacao: 0,
    pipelineStatus: pipelineStatus,
    calculatedStage: pipelineStatus,
    cpf: cliente.cpf,
    reuniaoStatus: cliente.reuniao_status,
    reuniaoData: cliente.reuniao_data,
    reuniaoHora: cliente.reuniao_hora,
    reuniaoLocal: cliente.reuniao_local,
    reuniaoTipo: cliente.reuniao_tipo,
    reuniaoLink: cliente.reuniao_link,
    consultorNome: cliente.consultor_nome,
    consultorEmail: cliente.consultor_email,
    resultadoReuniao: cliente.resultado_reuniao,
    motivoRecusa: cliente.motivo_recusa,
    createdAt: cliente.created_at,
    updatedAt: cliente.updated_at || cliente.created_at,
  };
}

/**
 * Transform LeadJourney (from aggregator) to the frontend lead format
 * This provides accumulated data from all 4 tables in the Kanban
 */
function transformJourneyToLead(journey: LeadJourney): Record<string, any> {
  return {
    id: journey.id,
    tenantId: journey.tenantId,
    name: journey.nome,
    phone: journey.telefone,
    telefone: journey.telefone,
    telefoneNormalizado: journey.telefoneNormalizado,
    nome: journey.nome,
    email: journey.email,
    cpf: journey.cpf,
    origem: journey.contact?.origem || 'supabase',
    pipelineStatus: journey.pipelineStatus,
    calculatedStage: journey.pipelineStatus,
    pipelineStageLabel: journey.pipelineStageLabel,
    formStatus: journey.form?.formStatus || 'not_sent',
    // FIX: Robust passed checking - consistent with leadJourneyAggregator
    qualificationStatus: (() => {
      const passedValue = journey.form?.passed;
      const isApproved = passedValue === true || passedValue === 'true' || 
                         passedValue === 'approved' || passedValue === 'aprovado' || passedValue === 1;
      const isRejected = passedValue === false || passedValue === 'false' || 
                         passedValue === 'rejected' || passedValue === 'reprovado' || passedValue === 0;
      return isApproved ? 'approved' : (isRejected ? 'rejected' : 'pending');
    })(),
    statusQualificacao: (() => {
      const passedValue = journey.form?.passed;
      const isApproved = passedValue === true || passedValue === 'true' || 
                         passedValue === 'approved' || passedValue === 'aprovado' || passedValue === 1;
      const isRejected = passedValue === false || passedValue === 'false' || 
                         passedValue === 'rejected' || passedValue === 'reprovado' || passedValue === 0;
      return isApproved ? 'aprovado' : (isRejected ? 'reprovado' : 'pendente');
    })(),
    pontuacao: journey.form?.totalScore || 0,
    formularioId: journey.form?.formId,
    submissionId: journey.form?.id,
    formularioConcluido: journey.form?.formStatus === 'completed',
    formularioConcluidoEm: journey.form?.formStatus === 'completed' ? journey.form?.updatedAt : null,
    formularioAberto: ['opened', 'started', 'completed'].includes(journey.form?.formStatus || ''),
    formularioAbertoEm: journey.form?.createdAt,
    // FIX: Check both aprovado and status fields for robust CPF status determination
    cpfStatus: (() => {
      if (!journey.cpfData) return undefined;
      const statusLower = (journey.cpfData.status || '').toLowerCase().trim();
      if (journey.cpfData.aprovado === true || statusLower === 'approved' || statusLower === 'aprovado') {
        return 'approved';
      }
      if (journey.cpfData.aprovado === false || statusLower === 'rejected' || statusLower === 'reprovado') {
        return 'rejected';
      }
      return undefined;
    })(),
    cpfCheckedAt: journey.cpfData?.dataConsulta,
    cpfRisco: journey.cpfData?.risco,
    cpfProcessos: journey.cpfData?.processos,
    reuniaoStatus: journey.meeting?.status,
    reuniaoData: journey.meeting?.data,
    reuniaoHora: journey.meeting?.hora,
    reuniaoLocal: journey.meeting?.local,
    reuniaoTipo: journey.meeting?.tipo,
    reuniaoTitulo: journey.meeting?.titulo, // Meeting title like "Reunião Online - Davi Emerick"
    reuniaoLink: journey.meeting?.link,
    consultorNome: journey.meeting?.consultorNome,
    consultorEmail: journey.meeting?.consultorEmail,
    resultadoReuniao: journey.meeting?.resultadoReuniao,
    motivoRecusa: journey.meeting?.motivoRecusa,
    meetingStatus: journey.meeting?.status === 'agendada' ? 'scheduled' :
                   journey.meeting?.status === 'realizada' ? 'completed' :
                   journey.meeting?.status === 'pendente' ? 'pending' : undefined,
    meetingScheduledAt: journey.meeting?.data,
    timeline: journey.timeline,
    contact: journey.contact,
    form: journey.form,
    cpfData: journey.cpfData ? {
      id: journey.cpfData.id,
      cpf: journey.cpfData.cpf,
      nome: journey.cpfData.nome,
      telefone: journey.cpfData.telefone,
      status: journey.cpfData.status,
      risco: journey.cpfData.risco,
      processos: journey.cpfData.processos,
      aprovado: journey.cpfData.aprovado,
      dataConsulta: journey.cpfData.dataConsulta,
      checkId: journey.cpfData.checkId,
      queryId: journey.cpfData.queryId,
      comoAutor: journey.cpfData.comoAutor,
      comoReu: journey.cpfData.comoReu,
    } : undefined,
    meeting: journey.meeting,
    hasContact: !!journey.contact,
    hasForm: !!journey.form,
    hasCpf: !!journey.cpfData,
    hasMeeting: !!journey.meeting,
    hasFormularioEnvio: !!journey.formularioEnvio,
    formularioEnvio: journey.formularioEnvio ? {
      id: journey.formularioEnvio.id,
      formId: journey.formularioEnvio.formId || (journey.formularioEnvio as any).form_id,
      telefone: journey.formularioEnvio.telefone,
      telefoneNormalizado: journey.formularioEnvio.telefoneNormalizado || (journey.formularioEnvio as any).telefone_normalizado,
      nome: journey.formularioEnvio.nome,
      formUrl: journey.formularioEnvio.formUrl || (journey.formularioEnvio as any).form_url,
      enviadoEm: journey.formularioEnvio.enviadoEm || (journey.formularioEnvio as any).enviado_em || journey.formularioEnvio.createdAt,
      status: journey.formularioEnvio.status,
      tentativas: journey.formularioEnvio.tentativas,
      ultimaTentativa: journey.formularioEnvio.ultimaTentativa || (journey.formularioEnvio as any).ultima_tentativa,
      createdAt: journey.formularioEnvio.createdAt || (journey.formularioEnvio as any).created_at,
    } : undefined,
    formularioEnviadoEm: journey.formularioEnvio?.enviadoEm || (journey.formularioEnvio as any)?.enviado_em || journey.formularioEnvio?.createdAt,
    formularioUrl: journey.formularioEnvio?.formUrl || (journey.formularioEnvio as any)?.form_url,
    createdAt: journey.createdAt,
    updatedAt: journey.updatedAt,
    // Dashboard fields from clientes_completos
    statusAtendimento: journey.statusAtendimento,
    setorAtual: journey.setorAtual,
    ativo: journey.ativo,
    tipoReuniaoAtual: journey.tipoReuniaoAtual,
    primeiroContato: journey.primeiroContato,
    ultimoContato: journey.ultimoContato,
    ultimaAtividade: journey.ultimaAtividade,
    totalRegistros: journey.totalRegistros,
    registrosDadosCliente: journey.registrosDadosCliente,
    totalMensagensChat: journey.totalMensagensChat,
    totalTranscricoes: journey.totalTranscricoes,
    fontesDados: journey.fontesDados,
    temDadosCliente: journey.temDadosCliente,
    temHistoricoChat: journey.temHistoricoChat,
    temTranscricoes: journey.temTranscricoes,
    mensagensCliente: journey.mensagensCliente,
    mensagensAgente: journey.mensagensAgente,
    primeiraMensagem: journey.primeiraMensagem,
    ultimaMensagem: journey.ultimaMensagem,
    ultimoResumoEstruturado: journey.ultimoResumoEstruturado,
    todas_mensagens_chat: journey.todasMensagensChat,
    // Chat history from n8n_chat_histories
    chatHistory: journey.chatHistory,
  };
}

/**
 * Fetch leads directly from Supabase with tenant isolation
 * Combines form_submissions AND dados_cliente tables
 * dados_cliente entries without form submissions are "contato-inicial"
 * @param tenantId - Required tenant ID for multi-tenant isolation
 */
async function fetchLeadsFromSupabase(tenantId: string): Promise<any[]> {
  try {
    if (!tenantId || tenantId.trim() === '' || tenantId === 'default-tenant') {
      console.error('❌ [LeadsPipeline] tenantId inválido');
      return [];
    }
    
    const supabase = await getClientSupabaseClientStrict(tenantId);
    if (!supabase) {
      console.log(`ℹ️ [LeadsPipeline] Supabase não configurado para tenant ${tenantId}`);
      return [];
    }
    
    // Build variant list so data stored under 'emericks-tenant', 'emerick', etc.
    // is all found when the session tenantId is any one of those variants.
    const tenantVariants = getTenantLookupList(tenantId);
    console.log(`🔄 [LeadsPipeline] Buscando ALL 5 tabelas para tenant: ${tenantId} (variantes: ${tenantVariants.join(', ')})`);

    // ============================================================
    // PRIORIDADE DAS COLUNAS (mais alta = mais avançada na jornada)
    // 5. reunioes          → reuniao-agendada / reuniao-pendente / reuniao-completo
    // 4. cpf_compliance    → cpf-aprovado / cpf-reprovado
    // 3. form_submissions  → formulario-aprovado / formulario-reprovado
    // 2. form_compliance   → formulario-nao-preenchido
    // 1. dados_cliente     → contato-inicial
    // ============================================================
    const PRIORITY: Record<string, number> = {
      'reuniao-agendada': 90, 'reuniao-completo': 95, 'reuniao-nao-compareceu': 80,
      'cpf-aprovado': 70, 'cpf-reprovado': 65,
      'formulario-aprovado': 60, 'formulario-reprovado': 55,
      'formulario-nao-preenchido': 40,
      'contato-inicial': 10,
    };
    
    // Map: phoneNorm → merged lead object
    const leadsByPhone = new Map<string, any>();
    
    const mergeLead = (phone: string, newData: any) => {
      const norm = phone ? normalizePhone(phone) : phone;
      const key = norm || newData.id; // fallback to id if no phone
      
      if (!leadsByPhone.has(key)) {
        leadsByPhone.set(key, { ...newData, _phone: norm });
        return;
      }
      
      const existing = leadsByPhone.get(key)!;
      const existingPriority = PRIORITY[existing.pipelineStatus] || 0;
      const newPriority = PRIORITY[newData.pipelineStatus] || 0;
      
      // Merge: keep highest priority status, merge all other info
      const merged = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(newData).filter(([_, v]) => v !== null && v !== undefined && v !== '' && v !== 'Sem nome')
        ),
        // Always keep highest-priority pipeline status
        pipelineStatus: newPriority > existingPriority ? newData.pipelineStatus : existing.pipelineStatus,
        calculatedStage: newPriority > existingPriority ? newData.pipelineStatus : existing.pipelineStatus,
        // Keep best name (non-empty)
        nome: newData.nome && newData.nome !== 'Sem nome' ? newData.nome : existing.nome,
        _phone: norm,
      };
      
      leadsByPhone.set(key, merged);
    };

    // ============================================================
    // ⚡ ALL 5 TABLES IN PARALLEL (Promise.all) — was sequential before
    // ============================================================
    const [
      { data: clientes, error: clientesError },
      { data: tracking, error: trackingError },
      { data: submissions, error: submissionsError },
      { data: cpfResults, error: cpfError },
      { data: reunioes, error: reunioesError }
    ] = await Promise.all([
      supabase.from('dados_cliente').select('*').in('tenant_id', tenantVariants).order('created_at', { ascending: false }).limit(500),
      supabase.from('form_submissions_compliance_tracking').select('*').in('tenant_id', tenantVariants).order('created_at', { ascending: false }).limit(500),
      supabase.from('form_submissions').select('*').in('tenant_id', tenantVariants).order('updated_at', { ascending: false }).limit(500),
      supabase.from('cpf_compliance_results').select('*').in('tenant_id', tenantVariants).order('created_at', { ascending: false }).limit(500),
      supabase.from('reunioes').select('*').in('tenant_id', tenantVariants).order('created_at', { ascending: false }).limit(500),
    ]);

    // --- TABELA 1: dados_cliente → contato-inicial ---
    if (clientesError) {
      console.error('❌ dados_cliente error:', clientesError.message);
    } else {
      console.log(`✅ dados_cliente: ${clientes?.length || 0} rows`);
      for (const c of (clientes || [])) {
        const nome = c['NomeWpp'] || c['nomewpp'] || c.nome || 'Sem nome';
        mergeLead(c.telefone || '', {
          id: c.id, tenantId: c.tenant_id || tenantId,
          telefone: c.telefone, nome, email: c.email, cpf: c.cpf,
          origem: 'dados_cliente', pipelineStatus: 'contato-inicial', calculatedStage: 'contato-inicial',
          qualificationStatus: 'pending', statusQualificacao: 'pendente', pontuacao: 0,
          createdAt: c.created_at, updatedAt: c.updated_at,
          dadosClienteReuniao: c.reuniao_status, dadosClienteReuniaoData: c.reuniao_data,
          dadosClienteConsultor: c.consultor_nome,
        });
      }
    }

    // --- TABELA 2: form_submissions_compliance_tracking → formulario-nao-preenchido ---
    if (trackingError) {
      console.error('❌ form_submissions_compliance_tracking error:', trackingError.message);
    } else {
      console.log(`✅ form_compliance_tracking: ${tracking?.length || 0} rows`);
      for (const t of (tracking || [])) {
        const nome = t.nome || t.name || t['NomeWpp'] || 'Sem nome';
        mergeLead(t.telefone || t.phone || '', {
          id: t.id, tenantId: t.tenant_id || tenantId,
          telefone: t.telefone || t.phone, nome, email: t.email,
          origem: 'form_compliance_tracking', pipelineStatus: 'formulario-nao-preenchido', calculatedStage: 'formulario-nao-preenchido',
          qualificationStatus: 'pending', statusQualificacao: 'pendente', pontuacao: 0,
          trackingTipo: t.tipo, trackingStatus: t.status,
          createdAt: t.created_at, updatedAt: t.updated_at,
        });
      }
    }

    // --- TABELA 3: form_submissions → formulario-aprovado / reprovado ---
    if (submissionsError) {
      console.error('❌ form_submissions error:', submissionsError.message);
    } else {
      console.log(`✅ form_submissions: ${submissions?.length || 0} rows`);
      for (const s of (submissions || [])) {
        const isApproved = s.passed === true || s.passed === 'true' || s.passed === 'approved' || s.passed === 1;
        const isRejected = s.passed === false || s.passed === 'false' || s.passed === 'rejected' || s.passed === 0;
        const pipelineStatus = isApproved ? 'formulario-aprovado' : isRejected ? 'formulario-reprovado' : 'formulario-nao-preenchido';
        mergeLead(s.contact_phone || '', {
          id: s.id, tenantId: s.tenant_id || tenantId,
          telefone: s.contact_phone, nome: s.contact_name || 'Sem nome', email: s.contact_email, cpf: s.contact_cpf,
          origem: 'form_submissions', pipelineStatus, calculatedStage: pipelineStatus,
          qualificationStatus: isApproved ? 'approved' : isRejected ? 'rejected' : 'pending',
          statusQualificacao: isApproved ? 'aprovado' : isRejected ? 'reprovado' : 'pendente',
          pontuacao: s.total_score || 0, formularioId: s.form_id, submissionId: s.id,
          createdAt: s.created_at, updatedAt: s.updated_at,
        });
      }
    }

    // --- TABELA 4: cpf_compliance_results → cpf-aprovado / cpf-reprovado ---
    if (cpfError) {
      console.error('❌ cpf_compliance_results error:', cpfError.message);
    } else {
      console.log(`✅ cpf_compliance_results: ${cpfResults?.length || 0} rows`);
      for (const c of (cpfResults || [])) {
        const isAprovado = c.aprovado === true || c.status === 'aprovado' || c.status === 'approved';
        const pipelineStatus = isAprovado ? 'cpf-aprovado' : 'cpf-reprovado';
        const nome = c.nome || c['NomeWpp'] || 'Sem nome';
        mergeLead(c.telefone || '', {
          id: c.id, tenantId: c.tenant_id || tenantId,
          telefone: c.telefone, nome, email: c.email, cpf: c.cpf || c.cpf_number,
          origem: 'cpf_compliance_results', pipelineStatus, calculatedStage: pipelineStatus,
          qualificationStatus: isAprovado ? 'approved' : 'rejected',
          statusQualificacao: isAprovado ? 'aprovado' : 'reprovado',
          pontuacao: 0, cpfStatus: c.status,
          createdAt: c.created_at, updatedAt: c.updated_at,
        });
      }
    }

    // --- TABELA 5: reunioes → reuniao-agendada / reuniao-completo ---
    if (reunioesError) {
      console.error('❌ reunioes error:', reunioesError.message);
    } else {
      console.log(`✅ reunioes: ${reunioes?.length || 0} rows`);
      for (const r of (reunioes || [])) {
        const status = r.status || r.reuniao_status || 'agendada';
        let pipelineStatus = 'reuniao-agendada';
        if (status === 'realizada' || status === 'completed') pipelineStatus = 'reuniao-completo';
        else if (status === 'nao-compareceu' || status === 'no-show') pipelineStatus = 'reuniao-nao-compareceu';
        
        mergeLead(r.telefone || r.contact_phone || '', {
          id: r.id, tenantId: r.tenant_id || tenantId,
          telefone: r.telefone || r.contact_phone, nome: r.nome || r.contact_name || 'Sem nome',
          origem: 'reunioes', pipelineStatus, calculatedStage: pipelineStatus,
          qualificationStatus: 'pending', statusQualificacao: 'pendente', pontuacao: 0,
          reuniaoStatus: status, reuniaoData: r.data || r.reuniao_data, reuniaoHora: r.hora,
          reuniaoLocal: r.local, consultorNome: r.consultor_nome,
          createdAt: r.created_at, updatedAt: r.updated_at,
        });
      }
    }

    const result = Array.from(leadsByPhone.values());

    console.log(`✅ [LeadsPipeline] Total merged: ${result.length} leads únicos de 5 tabelas (tenant: ${tenantId})`);
    
    // Log distribution per stage
    const stageCounts: Record<string, number> = {};
    for (const l of result) {
      stageCounts[l.pipelineStatus] = (stageCounts[l.pipelineStatus] || 0) + 1;
    }
    console.log('📊 Distribuição:', JSON.stringify(stageCounts));
    
    return result;
    
  } catch (error) {
    console.error('❌ [LeadsPipeline] Erro ao buscar leads do Supabase:', error);
    return [];
  }
}


const UNIFIED_PIPELINE_QUERY = `
  SELECT 
    l.id,
    l.tenant_id,
    l.telefone,
    l.telefone_normalizado,
    l.nome,
    l.email,
    l.origem,
    l.whatsapp_id,
    l.whatsapp_instance,
    l.whatsapp_label_id,
    l.primeira_mensagem_em,
    l.ultima_mensagem_em,
    l.total_mensagens,
    l.formulario_url,
    l.formulario_enviado,
    l.formulario_enviado_em,
    l.formulario_aberto,
    l.formulario_aberto_em,
    l.formulario_visualizacoes,
    l.formulario_iniciado,
    l.formulario_iniciado_em,
    l.formulario_concluido,
    l.formulario_concluido_em,
    l.form_status,
    l.pontuacao,
    l.status_qualificacao,
    l.qualification_status,
    l.motivo_reprovacao,
    l.formulario_id,
    l.submission_id,
    l.cpf,
    l.cpf_normalizado,
    l.cpf_check_id,
    l.cpf_status,
    l.cpf_checked_at,
    l.meeting_id,
    l.meeting_status,
    l.meeting_scheduled_at,
    l.pipeline_status,
    l.ip_address,
    l.user_agent,
    l.tags,
    l.observacoes,
    l.created_at,
    l.updated_at,
    -- Meeting data from dados_cliente
    dc.reuniao_status,
    dc.reuniao_data,
    dc.reuniao_hora,
    dc.reuniao_local,
    dc.reuniao_tipo,
    dc.reuniao_link,
    dc.consultor_nome,
    dc.consultor_email,
    dc.resultado_reuniao,
    dc.motivo_recusa,
    -- ✅ REGRA CORRETA: Stage baseado APENAS em tabelas específicas
    -- dados_cliente → SEMPRE contato-inicial (reuniao_status é metadado, não Kanban)
    -- reunioes (separada) → determina colunas de reunião via l.meeting_status
    CASE
      WHEN dc.resultado_reuniao IS NOT NULL THEN 'consultor'
      WHEN l.meeting_status = 'completed' THEN 'reuniao-completo'
      WHEN l.meeting_status = 'scheduled' THEN 'reuniao-agendada'
      WHEN l.meeting_status = 'pending' THEN 'reuniao-pendente'
      WHEN l.cpf_status = 'rejected' THEN 'cpf-reprovado'
      WHEN l.cpf_status = 'approved' THEN 'cpf-aprovado'
      WHEN l.qualification_status = 'rejected' THEN 'formulario-reprovado'
      WHEN l.qualification_status = 'approved' THEN 'formulario-aprovado'
      WHEN l.formulario_concluido = true THEN 'formulario-completo'
      WHEN l.formulario_iniciado = true AND l.formulario_concluido = false THEN 'formulario-incompleto'
      WHEN l.formulario_aberto = true THEN 'formulario-aberto'
      WHEN l.formulario_enviado = true THEN 'formulario-enviado'
      ELSE 'contato-inicial'
    END as calculated_stage
  FROM leads l
  LEFT JOIN dados_cliente dc ON l.meeting_id = dc.id
`;

router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Pagination parameters - default 50 leads per page to avoid proxy buffering
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100); // Max 100 per page
    const stage = req.query.stage as string || null; // Optional filter by stage
    const forceRefresh = req.query.refresh === 'true';

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'tenantId is required'
      });
    }
    
    // Validate tenantId format to prevent SQL injection
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tenantId format'
      });
    }

    // 🔐 SECURITY: Validate that the authenticated user can access this tenantId.
    // The session tenantId must be a variant of (or equal to) the requested tenantId.
    const sessionTenantId: string | undefined = (req as any).tenantId || (req as any).session?.tenantId;
    if (sessionTenantId && sessionTenantId !== 'system') {
      const sessionVariants = getTenantLookupList(sessionTenantId);
      const requestedVariants = getTenantLookupList(tenantId);
      const hasOverlap = sessionVariants.some(v => requestedVariants.includes(v));
      if (!hasOverlap) {
        console.warn(`[LeadsPipeline] 🚫 Acesso bloqueado: sessão="${sessionTenantId}" tentou acessar tenant="${tenantId}"`);
        return res.status(403).json({
          success: false,
          error: 'Acesso negado: você não tem permissão para ver dados deste tenant'
        });
      }
    }

    let allLeads: any[] = [];
    let source = 'supabase-aggregated';

    // Check cache first to avoid browser timeout (Replit proxy has ~5s timeout)
    const cacheState = getCachedLeads(tenantId);
    
    if (cacheState.data && !forceRefresh) {
      // Use cached data for immediate response
      allLeads = cacheState.data;
      source = cacheState.isStale ? 'cache-stale' : 'cache-fresh';
      console.log(`[LeadsPipeline] Using ${source} data (${allLeads.length} leads)`);
      
      // Trigger background refresh if stale
      if (cacheState.isStale && !cacheState.isPending) {
        refreshLeadsCacheBackground(tenantId);
      }
    } else if (cacheState.isPending) {
      // A refresh is already pending - wait for it with full timeout
      console.log('[LeadsPipeline] Waiting for pending refresh...');
      const completed = await waitForPendingRefresh(tenantId);
      
      if (completed) {
        const refreshedCache = getCachedLeads(tenantId);
        if (refreshedCache.data) {
          allLeads = refreshedCache.data;
          source = 'cache-fresh';
          console.log(`[LeadsPipeline] Using freshly cached data (${allLeads.length} leads)`);
        }
      }
      
      // If still no data after waiting, return 202 Accepted with retry-after header
      if (allLeads.length === 0) {
        console.log('[LeadsPipeline] Timeout waiting for data - returning 202 Accepted');
        res.setHeader('Retry-After', '2');
        return res.status(202).json({
          success: true,
          status: 'loading',
          message: 'Data is being prepared. Please retry in 2 seconds.',
          data: {
            stages: [...PIPELINE_STAGES],
            leads: [],
            counts: Object.fromEntries(PIPELINE_STAGES.map(s => [s, 0])),
            source: 'loading',
            pagination: { page: 1, pageSize, totalLeads: 0, totalPages: 0, hasMore: false, isLoading: true }
          }
        });
      }
    } else {
      // No cache - start refresh and wait for it
      console.log('[LeadsPipeline] No cache - starting data fetch...');
      
      // ⚡ FIX: Start refresh promise using fast fetchLeadsFromSupabase
      const refreshPromise = (async () => {
        try {
          // PRIMARY path: fast parallel Supabase query
          const leads = await fetchLeadsFromSupabase(tenantId);
          leadsCache.set(tenantId, { data: leads, timestamp: Date.now(), tenantId });
          console.log(`[LeadsCache] Initial load: ${leads.length} leads cached via fetchLeadsFromSupabase`);
        } catch (error) {
          console.error('[LeadsCache] Initial load failed:', error);
        } finally {
          pendingRefreshes.delete(tenantId);
        }
      })();
      
      pendingRefreshes.set(tenantId, refreshPromise);
      
      // ⚡ FIX: Wait up to 2s (reduced from 4.5s) for fast initial response
      const completed = await waitForPendingRefresh(tenantId);
      
      if (completed) {
        const refreshedCache = getCachedLeads(tenantId);
        if (refreshedCache.data) {
          allLeads = refreshedCache.data;
          source = 'fresh';
          console.log(`[LeadsPipeline] Fresh data loaded (${allLeads.length} leads)`);
        }
      }
      
      // If still no data after waiting, return 202 Accepted
      if (allLeads.length === 0) {
        console.log('[LeadsPipeline] Returning 202 - data still loading');
        res.setHeader('Retry-After', '2');
        return res.status(202).json({
          success: true,
          status: 'loading',
          message: 'Data is being prepared. Please retry in 2 seconds.',
          data: {
            stages: [...PIPELINE_STAGES],
            leads: [],
            counts: Object.fromEntries(PIPELINE_STAGES.map(s => [s, 0])),
            source: 'loading',
            pagination: { page: 1, pageSize, totalLeads: 0, totalPages: 0, hasMore: false, isLoading: true }
          }
        });
      }
    }

    // Calculate counts BEFORE pagination (always include full counts)
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(stg => {
      counts[stg] = 0;
    });

    allLeads.forEach(lead => {
      const leadStage = lead.calculatedStage || lead.pipelineStatus || 'contato-inicial';
      if (counts[leadStage] !== undefined) {
        counts[leadStage]++;
      }
    });

    // Filter by stage if specified
    let filteredLeads = allLeads;
    if (stage && PIPELINE_STAGES.includes(stage)) {
      filteredLeads = allLeads.filter(lead => {
        const leadStage = lead.calculatedStage || lead.pipelineStatus || 'contato-inicial';
        return leadStage === stage;
      });
    }

    // Apply pagination
    const totalLeads = filteredLeads.length;
    const totalPages = Math.ceil(totalLeads / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

    // Prepare response data with pagination metadata
    const responseData = {
      success: true,
      data: {
        stages: [...PIPELINE_STAGES],
        leads: paginatedLeads,
        counts,
        source: source,
        pagination: {
          page,
          pageSize,
          totalLeads,
          totalPages,
          hasMore: page < totalPages,
          stageFilter: stage
        }
      }
    };
    
    // Log before sending
    console.log(`[LeadsPipeline] Sending page ${page}/${totalPages} with ${paginatedLeads.length}/${totalLeads} leads...`);
    
    // Set headers to prevent proxy buffering and caching in Replit's environment
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    // Use res.json() - Express handles Content-Type and serialization
    res.json(responseData);
    
    console.log(`[LeadsPipeline] Response sent successfully`);
  } catch (error) {
    console.error('Error fetching leads pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:tenantId/stage/:stage', async (req, res) => {
  try {
    const { tenantId, stage } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'tenantId is required'
      });
    }
    
    // Validate tenantId format to prevent SQL injection
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tenantId format'
      });
    }

    if (!PIPELINE_STAGES.includes(stage as PipelineStage)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stage. Must be one of: ${PIPELINE_STAGES.join(', ')}`
      });
    }

    let stageLeads: any[] = [];

    // 🔐 MULTI-TENANT STRICT: Use aggregator ONLY - no fallbacks to local DB
    // This ensures tenant isolation: each tenant only sees their own Supabase data
    const journeys = await aggregateLeadJourneys(tenantId);
    
    // Filter by stage - if Supabase is empty, return empty array (no fallback)
    stageLeads = journeys
      .filter(journey => journey.pipelineStatus === stage)
      .map(journey => transformJourneyToLead(journey));
    
    console.log(`[LeadsPipeline] Stage ${stage}: ${stageLeads.length} leads for tenant ${tenantId}`);

    res.json({
      success: true,
      data: {
        stage,
        leads: stageLeads,
        count: stageLeads.length
      }
    });
  } catch (error) {
    console.error('Error fetching leads by stage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads by stage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.patch('/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        error: 'leadId is required'
      });
    }

    const validation = updateLeadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    // Try local database first
    let existingLeads: any[] = [];
    let useSupabaseOnly = false;
    
    if (db) {
      try {
        existingLeads = await db
          .select()
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);
      } catch (localError: any) {
        // Local table doesn't exist - use Supabase-only mode
        if (localError.message?.includes('does not exist') || localError.cause?.code === '42P01') {
          console.log('ℹ️ [LeadsPipeline] Tabela leads local não existe - atualizando direto no Supabase');
          useSupabaseOnly = true;
        } else {
          throw localError;
        }
      }
    } else {
      useSupabaseOnly = true;
    }

    // If in Supabase-only mode, update directly in Supabase
    if (useSupabaseOnly || existingLeads.length === 0) {
      const data = validation.data;
      
      // Require tenantId for multi-tenant isolation in Supabase-only mode
      const tenantId = req.body.tenantId || req.query.tenantId;
      if (!tenantId || typeof tenantId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'tenantId é obrigatório para atualizações em modo Supabase'
        });
      }
      
      // 🔐 SECURITY FIX: Reject invalid tenantId values
      if (tenantId === 'default-tenant' || tenantId.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'tenantId inválido - "default-tenant" não é permitido'
        });
      }
      
      // Validate tenantId format to prevent injection
      if (!/^[a-zA-Z0-9-_]+$/.test(tenantId)) {
        return res.status(400).json({
          success: false,
          error: 'Formato inválido de tenantId'
        });
      }
      
      // 🔐 MULTI-TENANT STRICT: Use tenant-specific Supabase client (no fallbacks)
      const supabase = await getClientSupabaseClientStrict(tenantId);
      
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: `Supabase não configurado para tenant ${tenantId}. Configure via /configuracoes`
        });
      }
      
      const supabaseUpdate: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      // Map all relevant fields to Supabase columns
      if (data.pipelineStatus !== undefined) supabaseUpdate.pipeline_status = data.pipelineStatus;
      if (data.meetingStatus !== undefined) supabaseUpdate.meeting_status = data.meetingStatus;
      if (data.cpfStatus !== undefined) supabaseUpdate.cpf_status = data.cpfStatus;
      if (data.qualificationStatus !== undefined) supabaseUpdate.qualification_status = data.qualificationStatus;
      if (data.observacoes !== undefined) supabaseUpdate.observacoes = data.observacoes;
      
      // Try form_submissions first with tenant isolation
      let { data: updated, error } = await supabase
        .from('form_submissions')
        .update(supabaseUpdate)
        .eq('id', leadId)
        .eq('tenant_id', tenantId) // Multi-tenant isolation
        .select()
        .single();
      
      // If not found in form_submissions, try dados_cliente with tenant isolation
      if (error || !updated) {
        const { data: clientUpdated, error: clientError } = await supabase
          .from('dados_cliente')
          .update({
            ...supabaseUpdate,
            reuniao_status: data.meetingStatus === 'scheduled' ? 'agendada' : 
                           data.meetingStatus === 'completed' ? 'realizada' : 
                           data.meetingStatus === 'cancelled' ? 'cancelada' : 
                           data.meetingStatus === 'pending' ? 'pendente' : undefined
          })
          .eq('id', leadId)
          .eq('tenant_id', tenantId) // Multi-tenant isolation
          .select()
          .single();
        
        if (clientError) {
          console.error('❌ [LeadsPipeline] Erro ao atualizar no Supabase:', clientError);
          return res.status(404).json({
            success: false,
            error: 'Lead não encontrado no Supabase para este tenant'
          });
        }
        
        updated = clientUpdated;
      }
      
      console.log(`✅ [LeadsPipeline] Lead ${leadId} atualizado no Supabase (tenant: ${tenantId}) com sucesso`);
      
      // Invalidate cache after mutation
      invalidateLeadsCache(tenantId);
      
      return res.json({
        success: true,
        data: updated,
        source: 'supabase'
      });
    }

    if (existingLeads.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    const existingLead = existingLeads[0];
    const data = validation.data;

    const updateLeadData: Record<string, any> = {
      updatedAt: new Date()
    };

    if (data.pipelineStatus !== undefined) {
      updateLeadData.pipelineStatus = data.pipelineStatus;
    }
    if (data.meetingStatus !== undefined) {
      updateLeadData.meetingStatus = data.meetingStatus;
    }
    if (data.cpfStatus !== undefined) {
      updateLeadData.cpfStatus = data.cpfStatus;
    }
    if (data.qualificationStatus !== undefined) {
      updateLeadData.qualificationStatus = data.qualificationStatus;
    }
    if (data.observacoes !== undefined) {
      updateLeadData.observacoes = data.observacoes;
    }

    const hasMeetingData = data.meetingStatus !== undefined || 
                          data.consultorNome !== undefined ||
                          data.reuniaoData !== undefined ||
                          data.reuniaoHora !== undefined ||
                          data.reuniaoLocal !== undefined ||
                          data.reuniaoTipo !== undefined ||
                          data.resultadoReuniao !== undefined;

    let meetingRecord = null;

    if (hasMeetingData) {
      const meetingData: Record<string, any> = {
        tenantId: existingLead.tenantId,
        leadId: leadId,
        nome: existingLead.nome || 'Lead',
        telefone: existingLead.telefone,
        telefoneNormalizado: existingLead.telefoneNormalizado,
        email: existingLead.email,
        cpf: existingLead.cpf,
        updatedAt: new Date()
      };

      if (data.consultorNome !== undefined) {
        meetingData.consultorNome = data.consultorNome;
      }
      if (data.consultorEmail !== undefined) {
        meetingData.consultorEmail = data.consultorEmail;
      }
      if (data.reuniaoData !== undefined) {
        meetingData.reuniaoData = new Date(data.reuniaoData);
      }
      if (data.reuniaoHora !== undefined) {
        meetingData.reuniaoHora = data.reuniaoHora;
      }
      if (data.reuniaoLocal !== undefined) {
        meetingData.reuniaoLocal = data.reuniaoLocal;
      }
      if (data.reuniaoTipo !== undefined) {
        meetingData.reuniaoTipo = data.reuniaoTipo;
      }
      if (data.reuniaoLink !== undefined) {
        meetingData.reuniaoLink = data.reuniaoLink;
      }
      if (data.resultadoReuniao !== undefined) {
        meetingData.resultadoReuniao = data.resultadoReuniao;
      }
      if (data.motivoRecusa !== undefined) {
        meetingData.motivoRecusa = data.motivoRecusa;
      }

      if (data.meetingStatus === 'scheduled') {
        meetingData.reuniaoStatus = 'agendada';
      } else if (data.meetingStatus === 'completed') {
        meetingData.reuniaoStatus = 'realizada';
      } else if (data.meetingStatus === 'cancelled') {
        meetingData.reuniaoStatus = 'cancelada';
      } else if (data.meetingStatus === 'pending') {
        meetingData.reuniaoStatus = 'pendente';
      }

      if (existingLead.meetingId) {
        const [updated] = await db
          .update(dadosCliente)
          .set(meetingData)
          .where(eq(dadosCliente.id, existingLead.meetingId))
          .returning();
        
        meetingRecord = updated;
      } else {
        const [created] = await db
          .insert(dadosCliente)
          .values(meetingData)
          .returning();
        
        meetingRecord = created;
        updateLeadData.meetingId = created.id;
      }

      if (data.meetingStatus === 'scheduled' && !updateLeadData.meetingScheduledAt) {
        updateLeadData.meetingScheduledAt = new Date();
      }
    }

    const [updatedLead] = await db
      .update(leads)
      .set(updateLeadData)
      .where(eq(leads.id, leadId))
      .returning();

    const responseData = transformRowToCamelCase({
      ...updatedLead,
      reuniao_status: meetingRecord?.reuniaoStatus,
      reuniao_data: meetingRecord?.reuniaoData,
      reuniao_hora: meetingRecord?.reuniaoHora,
      reuniao_local: meetingRecord?.reuniaoLocal,
      reuniao_tipo: meetingRecord?.reuniaoTipo,
      reuniao_link: meetingRecord?.reuniaoLink,
      consultor_nome: meetingRecord?.consultorNome,
      consultor_email: meetingRecord?.consultorEmail,
      resultado_reuniao: meetingRecord?.resultadoReuniao,
      motivo_recusa: meetingRecord?.motivoRecusa,
    });

    // Invalidate cache after local DB mutation
    if (existingLead?.tenantId) {
      invalidateLeadsCache(existingLead.tenantId);
    }
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update lead data in Supabase (for Supabase-only mode)
 * This endpoint persists accumulated data when leads move through pipeline stages
 */
router.patch('/supabase/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const { tenantId, pipelineStatus, origem, ...updateData } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        error: 'leadId is required'
      });
    }
    
    // Validate leadId format (UUID)
    if (!/^[a-f0-9-]{36}$/i.test(leadId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leadId format'
      });
    }
    
    // SECURITY: Require tenantId for multi-tenant isolation
    if (!tenantId || typeof tenantId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'tenantId é obrigatório para atualizações no Supabase'
      });
    }
    
    // Validate tenantId format to prevent injection
    if (!/^[a-zA-Z0-9-_]+$/.test(tenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Formato inválido de tenantId'
      });
    }
    
    // 🔐 SECURITY FIX: Reject invalid tenantId values
    if (tenantId === 'default-tenant' || tenantId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'tenantId inválido - "default-tenant" não é permitido'
      });
    }

    // 🔐 MULTI-TENANT STRICT: Use tenant-specific Supabase client (no fallbacks)
    const supabase = await getClientSupabaseClientStrict(tenantId);
    
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: `Supabase não configurado para tenant ${tenantId}. Configure em /configuracoes`
      });
    }
    
    console.log(`🔄 [LeadsPipeline] Atualizando lead ${leadId} no Supabase (tenant: ${tenantId})...`);
    
    // Determine which table to update based on origem
    const targetTable = origem === 'dados_cliente' ? 'dados_cliente' : 'form_submissions';
    
    // Build update object with only defined values
    const supabaseUpdate: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    // Map frontend camelCase to Supabase snake_case
    if (updateData.nome !== undefined) supabaseUpdate.nome = updateData.nome;
    if (updateData.email !== undefined) supabaseUpdate.email = updateData.email;
    if (updateData.telefone !== undefined) supabaseUpdate.telefone = updateData.telefone;
    if (updateData.cpf !== undefined) supabaseUpdate.cpf = updateData.cpf;
    if (updateData.observacoes !== undefined) supabaseUpdate.observacoes = updateData.observacoes;
    
    // Additional status fields for data accumulation
    if (updateData.cpfStatus !== undefined) supabaseUpdate.cpf_status = updateData.cpfStatus;
    if (updateData.qualificationStatus !== undefined) supabaseUpdate.qualification_status = updateData.qualificationStatus;
    
    // Meeting/reunion fields (for dados_cliente)
    if (updateData.reuniaoStatus !== undefined) supabaseUpdate.reuniao_status = updateData.reuniaoStatus;
    if (updateData.reuniaoData !== undefined) supabaseUpdate.reuniao_data = updateData.reuniaoData;
    if (updateData.reuniaoHora !== undefined) supabaseUpdate.reuniao_hora = updateData.reuniaoHora;
    if (updateData.reuniaoLocal !== undefined) supabaseUpdate.reuniao_local = updateData.reuniaoLocal;
    if (updateData.reuniaoTipo !== undefined) supabaseUpdate.reuniao_tipo = updateData.reuniaoTipo;
    if (updateData.reuniaoLink !== undefined) supabaseUpdate.reuniao_link = updateData.reuniaoLink;
    if (updateData.consultorNome !== undefined) supabaseUpdate.consultor_nome = updateData.consultorNome;
    if (updateData.consultorEmail !== undefined) supabaseUpdate.consultor_email = updateData.consultorEmail;
    if (updateData.resultadoReuniao !== undefined) supabaseUpdate.resultado_reuniao = updateData.resultadoReuniao;
    if (updateData.motivoRecusa !== undefined) supabaseUpdate.motivo_recusa = updateData.motivoRecusa;
    
    // Form-related fields (for form_submissions)
    if (updateData.formStatus !== undefined) supabaseUpdate.form_status = updateData.formStatus;
    if (updateData.totalScore !== undefined) supabaseUpdate.total_score = updateData.totalScore;
    if (updateData.passed !== undefined) supabaseUpdate.passed = updateData.passed;
    
    // Pipeline status - store in both tables if applicable
    if (pipelineStatus !== undefined) {
      supabaseUpdate.pipeline_status = pipelineStatus;
    }
    
    // SECURITY: Apply tenant isolation on all Supabase updates
    const { data: updatedRecord, error: updateError } = await supabase
      .from(targetTable)
      .update(supabaseUpdate)
      .eq('id', leadId)
      .eq('tenant_id', tenantId) // Multi-tenant isolation
      .select()
      .single();
    
    if (updateError) {
      console.error(`❌ [LeadsPipeline] Erro ao atualizar ${targetTable}:`, updateError);
      
      // If update failed on one table, try the other with tenant isolation
      const alternativeTable = targetTable === 'dados_cliente' ? 'form_submissions' : 'dados_cliente';
      
      const { data: altRecord, error: altError } = await supabase
        .from(alternativeTable)
        .update(supabaseUpdate)
        .eq('id', leadId)
        .eq('tenant_id', tenantId) // Multi-tenant isolation
        .select()
        .single();
      
      if (altError) {
        return res.status(500).json({
          success: false,
          error: 'Falha ao atualizar lead no Supabase para este tenant',
          details: updateError.message
        });
      }
      
      console.log(`✅ [LeadsPipeline] Lead atualizado em ${alternativeTable} (tenant: ${tenantId}) com sucesso`);
      
      // Invalidate cache after Supabase mutation
      invalidateLeadsCache(tenantId);
      
      return res.json({
        success: true,
        data: altRecord,
        table: alternativeTable
      });
    }
    
    console.log(`✅ [LeadsPipeline] Lead ${leadId} atualizado em ${targetTable} (tenant: ${tenantId}) com sucesso`);
    
    // Invalidate cache after Supabase mutation
    invalidateLeadsCache(tenantId);
    
    res.json({
      success: true,
      data: updatedRecord,
      table: targetTable
    });
    
  } catch (error) {
    console.error('Error updating lead in Supabase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead in Supabase',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create a new client in dados_cliente with "contato-inicial" status
 * This persists the label instead of just displaying it
 */
router.post('/supabase/dados-cliente', async (req, res) => {
  try {
    const { tenantId, nome, telefone, email, cpf, origem } = req.body;
    
    if (!tenantId || !nome) {
      return res.status(400).json({
        success: false,
        error: 'tenantId e nome são obrigatórios'
      });
    }
    
    // SECURITY: Validate tenantId format to prevent injection
    if (typeof tenantId !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(tenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Formato inválido de tenantId'
      });
    }
    
    // 🔐 SECURITY FIX: Reject invalid tenantId values
    if (tenantId === 'default-tenant' || tenantId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'tenantId inválido - "default-tenant" não é permitido'
      });
    }
    
    // 🔐 MULTI-TENANT STRICT: Use tenant-specific Supabase client (no fallbacks)
    const supabase = await getClientSupabaseClientStrict(tenantId);
    
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: `Supabase não configurado para tenant ${tenantId}. Configure em /configuracoes`
      });
    }
    
    console.log(`🔄 [LeadsPipeline] Criando novo cliente em dados_cliente...`);
    
    const telefoneNormalizado = telefone?.replace(/\D/g, '') || null;
    
    const { data: newClient, error: insertError } = await supabase
      .from('dados_cliente')
      .insert({
        tenant_id: tenantId,
        nome,
        telefone,
        telefone_normalizado: telefoneNormalizado,
        email,
        cpf,
        reuniao_status: 'pendente',
        pipeline_status: 'contato-inicial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [LeadsPipeline] Erro ao criar cliente:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Falha ao criar cliente',
        details: insertError.message
      });
    }
    
    console.log(`✅ [LeadsPipeline] Cliente criado com ID: ${newClient.id}`);
    
    // Invalidate cache after creating new client
    invalidateLeadsCache(tenantId);
    
    res.json({
      success: true,
      data: transformDadosClienteToLead(newClient)
    });
    
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create client',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔧 DEBUG: Endpoint to manually clear leads cache for a tenant
// Used when Supabase credentials change and cache needs to be refreshed
router.delete('/:tenantId/cache', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'tenantId is required'
      });
    }
    
    // Validate tenantId format
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tenantId format'
      });
    }
    
    // Get cache status before invalidation
    const cacheState = getCachedLeads(tenantId);
    const hadCache = !!cacheState.data;
    const cacheSize = cacheState.data?.length || 0;
    
    // Invalidate the cache
    invalidateLeadsCache(tenantId);
    
    console.log(`🗑️ [LeadsPipeline] Cache cleared for tenant: ${tenantId} (had ${cacheSize} leads)`);
    
    res.json({
      success: true,
      message: `Cache cleared for tenant ${tenantId}`,
      hadCache,
      previousCacheSize: cacheSize
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔧 DEBUG: Endpoint to clear all leads cache (admin only)
router.delete('/cache/all', async (req, res) => {
  try {
    const cacheSize = leadsCache.size;
    
    // Clear all cache
    invalidateLeadsCache();
    
    console.log(`🗑️ [LeadsPipeline] All cache cleared (${cacheSize} tenants)`);
    
    res.json({
      success: true,
      message: 'All cache cleared',
      previousCacheSize: cacheSize
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear all cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const leadsPipelineRoutes = router;
