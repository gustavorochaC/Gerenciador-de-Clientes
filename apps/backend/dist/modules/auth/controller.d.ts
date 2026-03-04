import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
/**
 * Login via Supabase Auth. Backend chama signInWithPassword e devolve
 * token (access_token), refreshToken e user no formato esperado pelo frontend.
 */
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/** Dados do usuário a partir do JWT já validado pelo middleware. */
export declare function me(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function logout(_req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map