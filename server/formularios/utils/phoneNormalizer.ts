/**
 * Utilitário de Normalização de Telefone
 * Garante matching perfeito entre WhatsApp e Banco de Dados
 */

/**
 * Normaliza telefone para formato padrão +5531999999999
 * 
 * Target format: +55 (country) + DDD (2 digits) + 9 + number (8 digits) = 13 digits + prefix
 * 
 * @param phone - Telefone em qualquer formato
 * @returns Telefone normalizado no formato +5531999999999
 * 
 * @example
 * normalizePhone('31999972368') // '+5531999972368'
 * normalizePhone('5531999972368') // '+5531999972368'
 * normalizePhone('553192267220@s.whatsapp.net') // '+5531992267220'
 * normalizePhone('+55 31 99997-2368') // '+5531999972368'
 * normalizePhone('3192267220') // '+5531992267220' (adds 55 and 9)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // 1. Remover sufixos de mensageiros e caracteres não numéricos
  let numero = phone.replace(/@.*$/, '').replace(/\D/g, '');
  
  // 2. Remover zeros à esquerda (ex: 031... -> 31...)
  numero = numero.replace(/^0+/, '');

  // 3. Caso especial: 550XX... (comum em preenchimentos manuais com 0 antes do DDD)
  if (numero.length >= 12 && numero.startsWith('550')) {
    numero = '55' + numero.substring(3);
  }
  
  // 4. Normalização baseada no comprimento para garantir formato: 55 + DDD(2) + 9 + número(8) = 13 dígitos
  if (numero.length === 10) {
    // 10 dígitos: DDD + 8 dígitos (sem 9º dígito e sem 55)
    // 3192267220 -> 5531992267220
    const ddd = numero.substring(0, 2);
    const resto = numero.substring(2);
    numero = '55' + ddd + '9' + resto;
  } else if (numero.length === 11) {
    // 11 dígitos: DDD + 9 dígitos (com 9º dígito mas sem 55)
    // 31992267220 -> 5531992267220
    numero = '55' + numero;
  } else if (numero.length === 12 && numero.startsWith('55')) {
    // 12 dígitos começando com 55: 55 + DDD + 8 dígitos (sem 9º dígito)
    // 553192267220 -> 5531992267220 (adiciona 9 após o DDD)
    const ddd = numero.substring(2, 4);
    const resto = numero.substring(4);
    numero = '55' + ddd + '9' + resto;
  } else if (numero.length === 13 && numero.startsWith('55')) {
    // 13 dígitos começando com 55: já completo (+55 31 9 8888 7777)
    // Nada a fazer
  } else if (numero.length > 13 && numero.startsWith('55')) {
    // Caso tenha dígitos extras no final (comum em logs de WhatsApp ou erros de input)
    // Pegar apenas os primeiros 13 se parecer um número brasileiro válido com 9
    numero = numero.substring(0, 13);
  }

  // 5. Retornar sempre com prefixo +
  return '+' + numero;
}

/**
 * Extrai telefone de ID do WhatsApp
 * 
 * @param whatsappId - ID do WhatsApp (ex: 5531999999999@s.whatsapp.net)
 * @returns Telefone normalizado
 * 
 * @example
 * extractPhoneFromWhatsAppId('5531999972368@s.whatsapp.net') // '+5531999972368'
 */
export function extractPhoneFromWhatsAppId(whatsappId: string): string {
  const numero = whatsappId.replace(/@.*$/, '');
  return normalizePhone(numero);
}

/**
 * Compara se dois telefones são iguais (após normalização)
 * 
 * @param phone1 - Primeiro telefone
 * @param phone2 - Segundo telefone
 * @returns true se os telefones são iguais
 * 
 * @example
 * phonesMatch('31999972368', '5531999972368@s.whatsapp.net') // true
 * phonesMatch('+55 31 99997-2368', '5531999972368') // true
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const norm1 = normalizePhone(phone1);
  const norm2 = normalizePhone(phone2);
  return norm1 === norm2;
}

/**
 * Valida se um telefone brasileiro está no formato correto
 * 
 * @param phone - Telefone a validar
 * @returns true se válido
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  
  // Remove o +
  const digits = normalized.replace(/^\+/, '');
  
  // Deve ter 13 dígitos (55 + DDD + número)
  if (digits.length !== 13) return false;
  
  // Deve começar com 55 (Brasil)
  if (!digits.startsWith('55')) return false;
  
  // DDD deve ser válido (11-99)
  const ddd = parseInt(digits.substring(2, 4));
  if (ddd < 11 || ddd > 99) return false;
  
  // Nono dígito deve ser 9 para celulares
  const ninthDigit = digits.charAt(4);
  if (ninthDigit !== '9') return false;
  
  return true;
}

/**
 * Formata telefone para exibição
 * 
 * @param phone - Telefone normalizado
 * @returns Telefone formatado (ex: +55 31 99997-2368)
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/^\+/, '');
  
  if (digits.length === 13) {
    // +55 31 99997-2368
    return `+${digits.substring(0, 2)} ${digits.substring(2, 4)} ${digits.substring(4, 9)}-${digits.substring(9)}`;
  }
  
  return normalized;
}
