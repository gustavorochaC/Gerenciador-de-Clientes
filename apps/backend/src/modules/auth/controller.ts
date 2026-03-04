import { Request, Response } from 'express';
import { supabaseAuth } from '../../lib/supabase';
import { AuthRequest } from '../../middleware/auth';

/**
 * Login via Supabase Auth. Backend chama signInWithPassword e devolve
 * token (access_token), refreshToken e user no formato esperado pelo frontend.
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (!supabaseAuth) {
      return res.status(503).json({
        error: 'Login indisponível: SUPABASE_ANON_KEY não configurada.',
      });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: String(email).trim().toLowerCase(),
      password: String(password),
    });

    if (error) {
      const message =
        error.message === 'Invalid login credentials'
          ? 'Credenciais inválidas'
          : error.message;
      return res.status(401).json({ error: message });
    }

    if (!data.session || !data.user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const { session, user } = data;
    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email ||
      'Usuário';

    return res.json({
      token: session.access_token,
      refreshToken: session.refresh_token ?? null,
      user: {
        id: user.id,
        email: user.email ?? '',
        name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/** Dados do usuário a partir do JWT já validado pelo middleware. */
export async function me(req: AuthRequest, res: Response) {
  try {
    const name =
      (req.userMetadata?.full_name as string) ||
      (req.userMetadata?.name as string) ||
      req.userEmail ||
      'Usuário';

    return res.json({
      id: req.userId,
      email: req.userEmail,
      name,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function logout(_req: AuthRequest, res: Response) {
  return res.json({ message: 'Logout realizado com sucesso' });
}
