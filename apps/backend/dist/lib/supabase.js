"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAuth = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../.env' });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseServiceKey) {
    throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY no .env');
}
/** Cliente com service role: uso em queries (tabelas LG_*), cron, etc. */
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
/**
 * Cliente com anon key apenas para auth (signInWithPassword no servidor).
 * Não persiste sessão; usado só no endpoint POST /auth/login.
 */
exports.supabaseAuth = supabaseAnonKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    })
    : null;
//# sourceMappingURL=supabase.js.map