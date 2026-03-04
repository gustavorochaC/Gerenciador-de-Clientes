"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const supabase_1 = require("../lib/supabase");
/**
 * Valida o token via Supabase Auth API (getUser). Não exige SUPABASE_JWT_SECRET.
 * Troca um pouco de latência (uma chamada ao Supabase por request) pela simplicidade.
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    if (!supabase_1.supabaseAuth) {
        console.error('SUPABASE_ANON_KEY não configurada');
        return res.status(500).json({ error: 'Configuração de autenticação inválida' });
    }
    try {
        const { data: { user }, error } = await supabase_1.supabaseAuth.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }
        req.userId = user.id;
        req.userEmail = user.email ?? '';
        req.userMetadata = user.user_metadata;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}
//# sourceMappingURL=auth.js.map