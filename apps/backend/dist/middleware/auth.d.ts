import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
    userMetadata?: Record<string, unknown>;
}
/**
 * Valida o token via Supabase Auth API (getUser). Não exige SUPABASE_JWT_SECRET.
 * Troca um pouco de latência (uma chamada ao Supabase por request) pela simplicidade.
 */
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.d.ts.map