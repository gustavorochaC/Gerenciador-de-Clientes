import { Request, Response, NextFunction } from 'express';
import { supabaseAuth } from '../lib/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userMetadata?: Record<string, unknown>;
}

/**
 * Valida o token via Supabase Auth API (getUser). Não exige SUPABASE_JWT_SECRET.
 * Troca um pouco de latência (uma chamada ao Supabase por request) pela simplicidade.
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  if (!supabaseAuth) {
    console.error('SUPABASE_ANON_KEY não configurada');
    return res.status(500).json({ error: 'Configuração de autenticação inválida' });
  }

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.userId = user.id;
    req.userEmail = user.email ?? '';
    req.userMetadata = (user as { user_metadata?: Record<string, unknown> }).user_metadata;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
