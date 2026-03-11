import { db } from "../db.js";
import { leads, formSubmissions } from "../../../shared/db-schema";
import { eq, and, desc } from "drizzle-orm";
import { normalizePhone } from "../utils/phoneNormalizer.js";

/**
 * Extrai telefone de ID do WhatsApp (remove @s.whatsapp.net)
 */
export function extrairTelefoneWhatsApp(whatsappId: string): string {
  return whatsappId.replace(/@.*/, '');
}

/**
 * Interface para criação de lead
 */
export interface CreateLeadData {
  telefone: string;
  telefoneNormalizado?: string;
  nome?: string;
  email?: string;
  whatsappId?: string;
  whatsappInstance?: string;
  tenantId?: string;
}

/**
 * Interface para atualização de status do formulário
 */
export interface UpdateFormStatusData {
  telefone: string;
  formStatus: 'not_sent' | 'sent' | 'incomplete' | 'completed';
  submissionId?: string;
  formularioId?: string;
}

/**
 * Busca ou cria um lead pelo telefone
 * Se o lead não existir, cria um novo com status 'not_sent'
 */
export async function buscarOuCriarLead(data: CreateLeadData) {
  try {
    const telefoneNormalizado = normalizePhone(data.telefone);
    
    console.log('🔍 Buscando lead:', {
      telefoneOriginal: data.telefone,
      telefoneNormalizado,
      nome: data.nome
    });
    
    // Busca lead existente
    const leadExistente = await db.query.leads.findFirst({
      where: eq(leads.telefoneNormalizado, telefoneNormalizado),
    });
    
    if (leadExistente) {
      console.log('✅ Lead encontrado:', leadExistente.id);
      
      // Atualiza informações se necessário
      if (data.nome && !leadExistente.nome) {
        await db.update(leads)
          .set({ 
            nome: data.nome,
            updatedAt: new Date()
          })
          .where(eq(leads.id, leadExistente.id));
        
        return { ...leadExistente, nome: data.nome };
      }
      
      return leadExistente;
    }
    
    // Cria novo lead
    console.log('➕ Criando novo lead');
    const [novoLead] = await db.insert(leads).values({
      telefone: data.telefone,
      telefoneNormalizado,
      nome: data.nome,
      email: data.email,
      whatsappId: data.whatsappId,
      whatsappInstance: data.whatsappInstance,
      tenantId: data.tenantId || (() => { throw new Error('[leadService] tenantId é obrigatório para criar lead'); })(),
      formStatus: 'not_sent',
      qualificationStatus: 'pending',
    }).returning();
    
    console.log('✅ Lead criado:', novoLead.id);
    return novoLead;
  } catch (error) {
    console.error('❌ Erro ao buscar/criar lead:', error);
    throw error;
  }
}

/**
 * Atualiza o status do formulário de um lead
 */
export async function atualizarStatusFormulario(data: UpdateFormStatusData) {
  try {
    const telefoneNormalizado = normalizePhone(data.telefone);
    
    console.log('📝 Atualizando status do formulário:', {
      telefone: telefoneNormalizado,
      status: data.formStatus
    });
    
    const updateData: any = {
      formStatus: data.formStatus,
      updatedAt: new Date(),
    };
    
    // Atualiza timestamps conforme o status
    if (data.formStatus === 'sent') {
      updateData.formSentAt = new Date();
    } else if (data.formStatus === 'incomplete') {
      updateData.formStartedAt = new Date();
    } else if (data.formStatus === 'completed') {
      updateData.formularioConcluidoEm = new Date();
    }
    
    // Adiciona IDs se fornecidos
    if (data.submissionId) {
      updateData.submissionId = data.submissionId;
    }
    if (data.formularioId) {
      updateData.formularioId = data.formularioId;
    }
    
    const [leadAtualizado] = await db.update(leads)
      .set(updateData)
      .where(eq(leads.telefoneNormalizado, telefoneNormalizado))
      .returning();
    
    console.log('✅ Status atualizado:', leadAtualizado?.id);
    return leadAtualizado;
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    throw error;
  }
}

/**
 * Atualiza a qualificação do lead (aprovado/reprovado) baseado na pontuação
 */
export async function atualizarQualificacao(
  telefone: string, 
  pontuacao: number, 
  pontuacaoMinima: number = 60
) {
  try {
    const telefoneNormalizado = normalizePhone(telefone);
    
    const qualificationStatus = pontuacao >= pontuacaoMinima ? 'approved' : 'rejected';
    
    console.log('🎯 Atualizando qualificação:', {
      telefone: telefoneNormalizado,
      pontuacao,
      pontuacaoMinima,
      resultado: qualificationStatus
    });
    
    const [leadAtualizado] = await db.update(leads)
      .set({
        pontuacao,
        qualificationStatus,
        updatedAt: new Date(),
      })
      .where(eq(leads.telefoneNormalizado, telefoneNormalizado))
      .returning();
    
    console.log('✅ Qualificação atualizada:', {
      id: leadAtualizado?.id,
      status: qualificationStatus,
      pontuacao
    });
    
    return leadAtualizado;
  } catch (error) {
    console.error('❌ Erro ao atualizar qualificação:', error);
    throw error;
  }
}

/**
 * Busca lead por telefone normalizado
 */
export async function buscarLeadPorTelefone(telefone: string) {
  try {
    const telefoneNormalizado = normalizePhone(telefone);
    
    const lead = await db.query.leads.findFirst({
      where: eq(leads.telefoneNormalizado, telefoneNormalizado),
      with: {
        formulario: true,
        submission: true,
      }
    });
    
    return lead;
  } catch (error) {
    console.error('❌ Erro ao buscar lead:', error);
    return null;
  }
}

/**
 * Lista todos os leads com paginação
 */
export async function listarLeads(limit: number = 100, offset: number = 0) {
  try {
    const todosLeads = await db.query.leads.findMany({
      limit,
      offset,
      orderBy: [desc(leads.createdAt)],
      with: {
        formulario: true,
        submission: true,
      }
    });
    
    return todosLeads;
  } catch (error) {
    console.error('❌ Erro ao listar leads:', error);
    throw error;
  }
}

/**
 * Busca estatísticas dos leads
 */
export async function obterEstatisticas() {
  try {
    const todosLeads = await db.query.leads.findMany();
    
    const mediaPontuacao = todosLeads.filter(l => l.pontuacao !== null).length > 0
      ? todosLeads.reduce((acc, l: any) => acc + (Number(l.pontuacao) || 0), 0) / 
        todosLeads.filter(l => l.pontuacao !== null).length
      : 0;

    const stats = {
      total: todosLeads.length,
      naoFezFormulario: todosLeads.filter(l => l.formStatus === 'not_sent').length,
      aguardandoResposta: todosLeads.filter(l => l.formStatus === 'sent' || l.formStatus === 'incomplete').length,
      emAnalise: todosLeads.filter(l => l.formStatus === 'completed' && l.qualificationStatus === 'pending').length,
      aprovados: todosLeads.filter(l => l.qualificationStatus === 'approved').length,
      reprovados: todosLeads.filter(l => l.qualificationStatus === 'rejected').length,
      pontuacaoMedia: mediaPontuacao,
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    throw error;
  }
}

/**
 * Quando um formulário é submetido, atualiza o lead
 */
export async function processarSubmissaoFormulario(
  submissionId: string,
  telefone: string
) {
  try {
    console.log('📋 Processando submissão de formulário:', { submissionId, telefone });
    
    // Busca a submissão
    const submission = await db.query.formSubmissions.findFirst({
      where: eq(formSubmissions.id, submissionId),
      with: {
        form: true
      }
    });
    
    if (!submission) {
      throw new Error('Submissão não encontrada');
    }
    
    const telefoneNormalizado = normalizePhone(telefone);
    
    // Busca ou cria o lead
    let lead = await buscarLeadPorTelefone(telefone);
    if (!lead) {
      lead = await buscarOuCriarLead({ telefone });
    }
    
    // Atualiza o lead com os dados da submissão
    const pontuacaoMinima = submission.form?.passingScore || 60;
    const qualificationStatus = submission.passed ? 'approved' : 'rejected';
    
    const [leadAtualizado] = await db.update(leads)
      .set({
        formStatus: 'completed',
        qualificationStatus,
        pontuacao: submission.totalScore,
        submissionId: submission.id,
        formularioId: submission.formId,
        formularioConcluidoEm: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.telefoneNormalizado, telefoneNormalizado))
      .returning();
    
    console.log('✅ Lead atualizado após submissão:', {
      id: leadAtualizado.id,
      status: qualificationStatus,
      pontuacao: submission.totalScore
    });
    
    return leadAtualizado;
  } catch (error) {
    console.error('❌ Erro ao processar submissão:', error);
    throw error;
  }
}
