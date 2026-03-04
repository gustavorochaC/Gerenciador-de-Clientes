import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY no .env');
}

/** Cliente com service role: uso em queries (tabelas LG_*), cron, etc. */
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Cliente com anon key apenas para auth (signInWithPassword no servidor).
 * Não persiste sessão; usado só no endpoint POST /auth/login.
 */
export const supabaseAuth: SupabaseClient | null = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
