import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useLeadStatus } from '../contexts/LeadStatusContext';

interface FormStatusBadgeProps {
  telefone?: string;
  className?: string;
  formStatus?: string;
  qualificationStatus?: string;
  pipelineStatus?: string;   // ← novo: estágio direto do Kanban
  pontuacao?: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

/**
 * Mapeamento canônico: pipelineStatus → { label, cor HSL }
 * Cores convertidas dos tokens Tailwind definidos no KanbanPage.tsx.
 *
 * Tailwind → HSL reference:
 *  bg-gray-200    → hsl(220,  9%, 80%)
 *  bg-yellow-200  → hsl( 50, 97%, 77%)
 *  bg-green-300   → hsl(142, 71%, 65%)
 *  bg-red-200     → hsl(  0, 96%, 76%)
 *  bg-teal-200    → hsl(172, 66%, 75%)
 *  bg-rose-200    → hsl(353, 96%, 82%)
 *  bg-amber-200   → hsl( 43, 96%, 75%)
 *  bg-red-300     → hsl(  0, 94%, 67%)
 *  bg-lime-200    → hsl( 82, 77%, 75%)
 *  bg-emerald-200 → hsl(152, 76%, 75%)
 *  bg-purple-200  → hsl(270, 67%, 82%)
 *  bg-indigo-200  → hsl(226, 70%, 80%)
 */
const PIPELINE_LABEL_MAP: Record<string, { text: string; color: string }> = {
  'contato-inicial':           { text: 'Contato Inicial',           color: 'hsl(220,  9%, 80%)' },
  'formulario-nao-preenchido': { text: 'Formulário Não Preenchido', color: 'hsl( 50, 97%, 77%)' },
  'formulario-aprovado':       { text: 'Aprovado',                  color: 'hsl(142, 71%, 65%)' },
  'formulario-reprovado':      { text: 'Reprovado',                 color: 'hsl(  0, 96%, 76%)' },
  'cpf-aprovado':              { text: 'CPF Aprovado',              color: 'hsl(172, 66%, 75%)' },
  'cpf-reprovado':             { text: 'CPF Reprovado',             color: 'hsl(353, 96%, 82%)' },
  'reuniao-agendada':          { text: 'Reunião Agendada',          color: 'hsl( 43, 96%, 75%)' },
  'reuniao-nao-compareceu':    { text: 'Reunião Não Compareceu',    color: 'hsl(  0, 94%, 67%)' },
  'reuniao-completo':          { text: 'Reunião Completa',          color: 'hsl( 82, 77%, 75%)' },
  'assinatura-pendente':       { text: 'Assinatura Pendente',       color: 'hsl(152, 76%, 75%)' },
  'revendedora':               { text: 'Revendedora',               color: 'hsl(270, 67%, 82%)' },
  'consultor':                 { text: 'Consultor',                 color: 'hsl(226, 70%, 80%)' },
};

/** Fallback para statuses legados baseados apenas em formStatus */
const FORM_STATUS_FALLBACK_MAP: Record<string, { text: string; color: string }> = {
  not_sent:       { text: 'Não está no Onboard', color: 'hsl(220, 9%, 46%)' },
  not_on_onboard: { text: 'Não está no Onboard', color: 'hsl(220, 9%, 46%)' },
  pending:        { text: 'Aguardando',           color: 'hsl( 38, 92%, 50%)' },
  completed:      { text: 'Formulário Enviado',   color: 'hsl(210, 79%, 46%)' },
};

/** Retorna preto ou branco dependendo da luminosidade do fundo. */
function getContrastColor(color: string): string {
  const hsl = color.match(/hsl\(\s*[\d.]+,\s*[\d.]+%,\s*([\d.]+)%\s*\)/);
  if (hsl) return parseFloat(hsl[1]) < 55 ? '#ffffff' : '#000000';

  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff';
  }

  return '#000000';
}

export function FormStatusBadge({
  telefone,
  className = '',
  formStatus: propFormStatus,
  qualificationStatus: propQualificationStatus,
  pipelineStatus: propPipelineStatus,
  pontuacao: propPontuacao,
  size = 'md',
}: FormStatusBadgeProps) {
  const { getStatus, loadStatuses, labels } = useLeadStatus();

  // Normaliza JID do WhatsApp para número puro (remove @s.whatsapp.net etc.)
  const normalizedTelefone = telefone?.replace(/@.*$/, '').replace(/\D/g, '') || '';

  // Modo "props diretas": quando qualquer status chega via prop, não consulta o context
  const hasPropsData = propPipelineStatus !== undefined || propFormStatus !== undefined;

  const loadedRef = useRef(false);
  useEffect(() => {
    if (hasPropsData || !normalizedTelefone || loadedRef.current) return;
    loadedRef.current = true;
    loadStatuses([normalizedTelefone]);
  }, [normalizedTelefone, hasPropsData, loadStatuses]);

  // Resolve valores: props têm prioridade, depois context
  const contextStatus   = hasPropsData ? null : getStatus(normalizedTelefone);
  const pipelineStatus  = propPipelineStatus      ?? contextStatus?.lead?.pipelineStatus   ?? undefined;
  const formStatus      = propFormStatus           ?? contextStatus?.lead?.formStatus        ?? 'not_sent';
  const qualificationStatus = propQualificationStatus ?? contextStatus?.lead?.qualificationStatus ?? undefined;
  const pontuacao       = propPontuacao !== undefined ? propPontuacao : contextStatus?.lead?.pontuacao;
  // exists: undefined = ainda carregando; true = encontrado; false = não existe no DB
  const exists          = contextStatus?.exists;

  // ── Loading inicial (context ainda não respondeu) ─────────────────────────
  if (!hasPropsData && !contextStatus && normalizedTelefone) {
    return (
      <Badge
        variant="outline"
        className={`border-0 font-medium animate-pulse ${SIZE_CLASSES[size]} ${className}`}
        style={{ backgroundColor: 'hsl(220, 9%, 80%)', color: '#000000', borderColor: 'hsl(220, 9%, 80%)' }}
      >
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        <span>Carregando...</span>
      </Badge>
    );
  }

  const getBadgeConfig = (): { style: React.CSSProperties; text: string } => {
    // ── REGRA 1: Contato não existe no banco → "Não está no Onboard" ──────────
    // Aplica quando o context retornou exists:false OU o formStatus indica ausência
    if (exists === false || formStatus === 'not_on_onboard' || formStatus === 'not_sent') {
      return {
        style: { backgroundColor: '#757575', color: '#ffffff', borderColor: '#757575' },
        text: 'Não está no Onboard',
      };
    }

    // ── REGRA 2: pipelineStatus → mapeamento direto com cores do Kanban ───────
    if (pipelineStatus && PIPELINE_LABEL_MAP[pipelineStatus]) {
      const entry = PIPELINE_LABEL_MAP[pipelineStatus];
      const showPoints = pontuacao != null && qualificationStatus !== 'pending';
      return {
        style: {
          backgroundColor: entry.color,
          color: getContrastColor(entry.color),
          borderColor: entry.color,
        },
        text: entry.text + (showPoints ? ` (${pontuacao}pts)` : ''),
      };
    }

    // ── REGRA 3: Etiqueta customizada configurada pelo usuário no sistema ─────
    if (Array.isArray(labels) && labels.length > 0) {
      const matchingLabel = labels.find((label) => {
        if (label.formStatus !== formStatus) return false;
        // qualificationStatus null/undefined na label = corresponde a qualquer valor
        if (label.qualificationStatus == null) return true;
        return label.qualificationStatus === qualificationStatus;
      });

      if (matchingLabel) {
        const showPoints = pontuacao != null && qualificationStatus !== 'pending';
        return {
          style: {
            backgroundColor: matchingLabel.cor,
            color: getContrastColor(matchingLabel.cor),
            borderColor: matchingLabel.cor,
          },
          text: matchingLabel.nome + (showPoints ? ` (${pontuacao}pts)` : ''),
        };
      }
    }

    // ── REGRA 4: Fallback legado por formStatus ───────────────────────────────
    const fallback = FORM_STATUS_FALLBACK_MAP[formStatus];
    if (fallback) {
      return {
        style: {
          backgroundColor: fallback.color,
          color: getContrastColor(fallback.color),
          borderColor: fallback.color,
        },
        text: fallback.text,
      };
    }

    // ── REGRA 5: Genérico ─────────────────────────────────────────────────────
    return {
      style: { backgroundColor: 'hsl(0, 0%, 70%)', color: '#ffffff', borderColor: 'hsl(0, 0%, 70%)' },
      text: 'Status indefinido',
    };
  };

  const config = getBadgeConfig();

  return (
    <Badge
      variant="outline"
      className={`border-0 font-medium flex items-center gap-1 ${SIZE_CLASSES[size]} ${className}`}
      style={config.style}
    >
      <span>{config.text}</span>
    </Badge>
  );
}
