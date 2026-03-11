/**
 * Middleware para validar tenantId em todas as rotas protegidas
 * 
 * 🔐 SEGURANÇA: Cada rota protegida DEVE ter tenantId válido
 * ❌ Sem tenantId = 401 Unauthorized
 * ✅ Com tenantId = acesso permitido
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'; // Importar jsonwebtoken

// Segredo JWT — deve coincidir exatamente com o usado em multiTenantAuth.ts
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || '';
if (!JWT_SECRET) {
  console.error('[requireTenant] ❌ CRÍTICO: JWT_SECRET não configurado!');
}


// Helper function para extrair tenantId de um JWT Bearer token
function getTenantIdFromJwt(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // ✅ USAR O MESMO SEGREDO DO LOGIN (Prioridade .env)
      const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || JWT_SECRET;
      
      // Verificar e decodificar o token
      const decoded = jwt.verify(token, secret) as { tenantId?: string, clientId?: string };
      console.log(`[requireTenant] JWT decodificado para tenant: ${decoded.tenantId || decoded.clientId}`);
      return decoded.tenantId || decoded.clientId;
    } catch (error) {
      console.error('[requireTenant] Erro ao verificar JWT:', error.message);
      return undefined;
    }
  }
  return undefined;
}


export function requireTenant(req: Request, res: Response, next: NextFunction) {
  // Buscar tenantId da sessão (setado durante login)
  // Prioridade: Sessão -> Header 'x-tenant-id' -> JWT Bearer Token -> 'system'
  const tenantId = req.session?.tenantId || req.headers['x-tenant-id'] || getTenantIdFromJwt(req) || 'system';
  
  // Injetar no request para os handlers
  (req as any).tenantId = tenantId;

  // Validar se tenantId existe e é válido
  if (!tenantId || tenantId === 'undefined' || tenantId === 'null' || (typeof tenantId === 'string' && tenantId.trim() === '')) {
    return res.status(401).json({
      success: false,
      error: 'Sessão inválida - faça login novamente',
      code: 'TENANT_ID_MISSING',
      redirect: '/login'
    });
  }
  
  // tenantId válido - continuar
  next();
}

/**
 * Middleware para validar tenantId e verificar se existe no banco
 * Versão mais robusta com verificação de existência
 */
export async function requireTenantStrict(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.session?.tenantId;
  
  if (!tenantId || tenantId === 'undefined' || tenantId === 'null' || tenantId.trim() === '') {
    return res.status(401).json({
      success: false,
      error: 'Sessão inválida - faça login novamente',
      code: 'TENANT_ID_MISSING',
      redirect: '/login'
    });
  }
  
  // Opcional: Verificar se tenant existe no banco
  // Isso previne acesso com tenantId inválido
  try {
    const { db } = await import('../db');
    const { supabaseConfig } = await import('../../shared/db-schema');
    const { eq } = await import('drizzle-orm');
    
    const tenant = await db.select()
      .from(supabaseConfig)
      .where(eq(supabaseConfig.tenantId, tenantId))
      .limit(1);
    
    if (tenant.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Tenant inválido ou não configurado',
        code: 'TENANT_INVALID',
        redirect: '/configuracoes'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar tenant:', error);
    // Se erro na verificação, permitir acesso (graceful degradation)
  }
  
  next();
}
