import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        clientId: string;
        tenantId: string;
        email: string;
        role?: "admin" | "reseller" | string;
        comissao?: number;
      };
    }
  }
}
