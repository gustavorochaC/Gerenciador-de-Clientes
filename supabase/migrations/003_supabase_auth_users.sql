-- ============================================
-- LoanTrack — Migrar FKs de LG_users para auth.users (Supabase Auth)
-- ============================================
-- Execute após ter usuários em auth.users (criados pelo painel Supabase).
-- Remove a tabela LG_users e aponta todas as FKs para auth.users(id).

-- LG_clients: user_id -> auth.users (nomes das FKs no PG podem ser com maiúsculas)
ALTER TABLE "LG_clients" DROP CONSTRAINT IF EXISTS "LG_clients_user_id_fkey";
ALTER TABLE "LG_clients"
  ADD CONSTRAINT "lg_clients_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- LG_loans: user_id -> auth.users
ALTER TABLE "LG_loans" DROP CONSTRAINT IF EXISTS "LG_loans_user_id_fkey";
ALTER TABLE "LG_loans"
  ADD CONSTRAINT "lg_loans_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- LG_transactions: user_id -> auth.users
ALTER TABLE "LG_transactions" DROP CONSTRAINT IF EXISTS "LG_transactions_user_id_fkey";
ALTER TABLE "LG_transactions"
  ADD CONSTRAINT "lg_transactions_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- LG_alerts: user_id -> auth.users
ALTER TABLE "LG_alerts" DROP CONSTRAINT IF EXISTS "LG_alerts_user_id_fkey";
ALTER TABLE "LG_alerts"
  ADD CONSTRAINT "lg_alerts_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remover tabela LG_users
DROP TABLE IF EXISTS "LG_users";
