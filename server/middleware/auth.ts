import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    clientId: string;
    tenantId: string;
    // ===== CAMPOS NEXUS (Revendedoras) =====
    role?: 'admin' | 'reseller';
    comissao?: number;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Primeiro, verificar se tem sessao valida (funciona em dev e prod)
  const sessionTenantId = req.session?.tenantId;
  const sessionUserId = req.session?.userId;
  const sessionEmail = req.session?.userEmail;
  const sessionRole = req.session?.userRole;
  const sessionComissao = req.session?.comissao;
  
  if (sessionTenantId && sessionUserId) {
    req.user = {
      userId: sessionUserId,
      email: sessionEmail || '',
      clientId: sessionTenantId,
      tenantId: sessionTenantId,
      role: sessionRole || 'admin',
      comissao: sessionComissao
    };
    return next();
  }

  // Debug log for production 401
  if (process.env.NODE_ENV === 'production') {
    console.log(`📡 [Auth] Sessão ausente para: ${req.method} ${req.path} | Cookie: ${req.headers.cookie ? 'Presente' : 'Ausente'}`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth-Dev] ${req.method} ${req.path} | Sessão: ${sessionUserId ? 'OK' : 'Ausente'}`);
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || '';
    if (!jwtSecret) {
      console.error('[Auth] JWT_SECRET não configurado!');
      return res.status(500).json({ success: false, error: 'Configuração de segurança ausente' });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      clientId: string;
      tenantId: string;
    };
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}
