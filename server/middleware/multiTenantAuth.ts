import { Request, Response, NextFunction } from 'express';

// Extender os tipos do Express Session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    userName?: string;
    companyName?: string;
    tenantId?: string;  // Tenant ID para isolamento completo de credenciais
    supabaseUrl?: string;
    supabaseKey?: string;
    // ===== CAMPOS NEXUS (Revendedoras) =====
    userRole?: 'admin' | 'reseller';
    resellerId?: string;  // ID da revendedora no Supabase Owner
    comissao?: number;
    projectName?: string;  // Nome da plataforma/projeto do admin
    companySlug?: string;  // Slug da empresa para isolamento de URL
  }
}

// Middleware para verificar se usuário está autenticado
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // ✅ SEGURANÇA: Nunca criar sessão automática — login real sempre exigido
  // Em desenvolvimento, apenas logar o acesso mas NÃO injetar sessão automática
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth-Dev] ${req.method} ${req.path}`);
  }

  // Exigir autenticação real em todos os ambientes
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Não autenticado',
      redirect: '/login'
    });
  }
  next();
}

// Middleware para adicionar dados do usuário nas requisições
export function attachUserData(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    (req as any).user = {
      id: req.session.userId,
      email: req.session.userEmail,
      nome: req.session.userName,
      supabaseUrl: req.session.supabaseUrl,
      supabaseKey: req.session.supabaseKey,
      // ===== CAMPOS NEXUS =====
      role: req.session.userRole || 'admin',
      comissao: req.session.comissao,
      tenantId: req.session.tenantId,
      userId: req.session.userId
    };
  }
  next();
}

// Middleware para verificar se rota é pública (não precisa de autenticação)
export function isPublicRoute(path: string): boolean {
  // Garantir que removemos parâmetros de query para verificação de extensão
  const cleanPath = (path || '').split('?')[0];

  // Permitir todas as rotas do Vite e assets
  if (cleanPath.startsWith('/@') ||
    cleanPath.startsWith('/node_modules') ||
    cleanPath.startsWith('/src') ||
    cleanPath.endsWith('.js') ||
    cleanPath.endsWith('.ts') ||
    cleanPath.endsWith('.tsx') ||
    cleanPath.endsWith('.jsx') ||
    cleanPath.endsWith('.css') ||
    cleanPath.endsWith('.json') ||
    cleanPath.endsWith('.png') ||
    cleanPath.endsWith('.jpg') ||
    cleanPath.endsWith('.jpeg') ||
    cleanPath.endsWith('.gif') ||
    cleanPath.endsWith('.svg') ||
    cleanPath.endsWith('.ico') ||
    cleanPath.endsWith('.woff') ||
    cleanPath.endsWith('.woff2') ||
    cleanPath.endsWith('.ttf') ||
    cleanPath.endsWith('.eot') ||
    cleanPath.endsWith('.wasm') ||
    cleanPath.endsWith('.map') ||
    cleanPath.endsWith('.mjs')) {
    return true;
  }

  const publicRoutes = [
    '/',             // Página inicial / Dashboard (redirecionamento interno)
    '/login',
    '/reuniao/',
    '/api/reunioes/',
    '/api/public/reuniao/',
    '/api/auth/',
    '/api/config/',
    '/api/reseller/login',
    '/api/reseller/register',
    '/api/reseller/check-session',
    '/api/pagarme/webhook',
    '/api/public/checkout/',
    '/reseller-login',
    '/revendedora',  // NEXUS: Plataforma de revendedoras tem login próprio
    '/assinar/',     // Assinatura digital pública (clientes)
    '/api/assinatura/public/',  // API de assinatura pública
    '/api/forms/public/',  // API de formulários públicos (by-slug, by-id, submit)
    '/api/submissions',    // Envio de formulários públicos
    '/api/formularios/submit',  // Envio de formulários (legacy)
    '/health',
    '/assets',
    '/form/',        // Formulário público direto
    '/f/',           // Formulário com token
    '/formulario/',  // Formulário público com slug da empresa
    '/w/',           // Workspace público (curto)
    '/workspace/share/', // Workspace público (longo)
    '/api/public/workspace/', // API de workspace pública
    '/api/n8n',      // API do n8n (tem autenticação própria)
  ];

  // Caso especial para prefixo /api/n8n para garantir isenção
  // Corrigindo para ser mais abrangente e capturar qualquer variação
  const normalizedPath = (path || '').toLowerCase();
  if (normalizedPath === '/api/n8n' || normalizedPath.startsWith('/api/n8n/') || normalizedPath.includes('/api/n8n')) {
    return true;
  }

  // Verificar padrões especiais de formulário público
  // /formulario/:companySlug/form/:id ou /:companySlug/form/:id
  if (/^\/formulario\/[^/]+\/form\/[^/]+/.test(path)) {
    return true;
  }
  if (/^\/[^/]+\/form\/[^/]+/.test(path) && !path.startsWith('/api/')) {
    return true;
  }

  // Verificar se o caminho exato é público ou se começa com um prefixo público (exceto '/')
  const isPublic = publicRoutes.some(route => {
    if (route === '/') return path === '/';
    return path.startsWith(route);
  });

  if (!isPublic && !path.startsWith('/api/')) {
    console.log(`[Auth-Check] Path ${path} is classified as PRIVATE`);
  }

  return isPublic;
}

export function redirectIfNotAuth(req: Request, res: Response, next: NextFunction) {
  const normalizedPath = (req.path || '').toLowerCase();

  // Em desenvolvimento, não redirecionar para simplificar testes
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth-Dev-Bypass] ${req.method} ${req.path}`);
    return next();
  }

  // Isenção explícita e agressiva para a API do n8n para evitar 401 do redirectIfNotAuth
  if (normalizedPath.startsWith('/api/n8n') || req.originalUrl.toLowerCase().startsWith('/api/n8n')) {
    console.log(`[Auth Bypass] Permitindo acesso público para API n8n: ${req.originalUrl}`);
    return next();
  }

  // Ignorar rotas públicas, API e assets
  if (isPublicRoute(req.path)) {
    return next();
  }

  // ✅ Aceitar JWT Bearer Token como autenticação válida (além da sessão)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
      if (!jwtSecret) {
        console.error('[Auth] CRÍTICO: JWT_SECRET não configurado — token não pode ser verificado');
        return next();
      }
      const decoded = require('jsonwebtoken').verify(token, jwtSecret) as any;
      if (decoded && decoded.userId) {
        // Injetar na sessão virtual para compatibilidade com downstream middleware
        if (req.session && !req.session.userId) {
          req.session.userId = decoded.userId;
          req.session.tenantId = decoded.tenantId || decoded.clientId || decoded.userId;
          req.session.userEmail = decoded.email;
          req.session.userName = decoded.name;
        }
        return next();
      }
    } catch (e) {
      // Token inválido, continuar para checar sessão
    }
  }

  // Se não está autenticado e está tentando acessar página protegida
  if (!req.session || !req.session.userId) {
    // Se é API, SEMPRE retornar 401 JSON
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({
        error: 'Não autenticado',
        redirect: '/login'
      });
    }

    // Se é página HTML, redirecionar
    if (req.accepts('html')) {
      return res.redirect('/login');
    }

    // Default: 401 JSON
    return res.status(401).json({
      error: 'Não autenticado',
      redirect: '/login'
    });
  }

  next();
}
