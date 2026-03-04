import { SupabaseClient } from '@supabase/supabase-js';
/** Cliente com service role: uso em queries (tabelas LG_*), cron, etc. */
export declare const supabase: SupabaseClient<any, "public", "public", any, any>;
/**
 * Cliente com anon key apenas para auth (signInWithPassword no servidor).
 * Não persiste sessão; usado só no endpoint POST /auth/login.
 */
export declare const supabaseAuth: SupabaseClient | null;
//# sourceMappingURL=supabase.d.ts.map