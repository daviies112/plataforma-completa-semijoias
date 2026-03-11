import { useEffect, useRef } from "react";
import { FormStatusBadge } from "./FormStatusBadge";
import { useLeadStatus } from "../contexts/LeadStatusContext";

interface LeadStatusLabelProps {
  phoneNumber: string; // JID do WhatsApp (xxx@s.whatsapp.net) ou número puro
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * LeadStatusLabel — exibe a etiqueta de status de um lead pelo telefone.
 *
 * Delega completamente a busca ao LeadStatusContext, que já recebe os dados
 * em batch pelo WhatsAppPlatformPage. Não faz chamadas individuais à API.
 * O pipelineStatus (quando disponível) tem prioridade sobre formStatus.
 */
export function LeadStatusLabel({
  phoneNumber,
  size = 'sm',
  className = '',
}: LeadStatusLabelProps) {
  const { loadStatuses } = useLeadStatus();

  const normalizedPhone = phoneNumber.replace(/@.*$/, '').replace(/\D/g, '');

  // Carrega dados apenas uma vez por número (sem polling)
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!normalizedPhone || loadedRef.current) return;
    loadedRef.current = true;
    loadStatuses([normalizedPhone]);
  }, [normalizedPhone, loadStatuses]);

  // FormStatusBadge lê pipelineStatus e formStatus direto do context
  return (
    <FormStatusBadge
      telefone={normalizedPhone}
      size={size}
      className={className}
    />
  );
}
