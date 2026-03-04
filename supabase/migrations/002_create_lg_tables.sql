-- ============================================
-- LoanTrack — Tabelas com prefixo LG_ (schema public)
-- ============================================

-- Depende de uuid-ossp (já criado em 001)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== LG_users ==========
CREATE TABLE "LG_users" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== LG_clients ==========
CREATE TABLE "LG_clients" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "LG_users"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_lg_clients_user_cpf ON "LG_clients"(user_id, cpf);
CREATE INDEX idx_lg_clients_user_id ON "LG_clients"(user_id);

-- ========== LG_loans ==========
CREATE TABLE "LG_loans" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "LG_users"(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES "LG_clients"(id) ON DELETE RESTRICT,
  principal_amount NUMERIC(14,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  total_installments INTEGER NOT NULL,
  installment_amount NUMERIC(14,2) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 28),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'defaulted', 'renegotiated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lg_loans_user_id ON "LG_loans"(user_id);
CREATE INDEX idx_lg_loans_client_id ON "LG_loans"(client_id);

-- ========== LG_installments ==========
CREATE TABLE "LG_installments" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES "LG_loans"(id) ON DELETE CASCADE,
  installment_no INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_at DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_id, installment_no)
);

CREATE INDEX idx_lg_installments_loan_id ON "LG_installments"(loan_id);

-- ========== LG_transactions ==========
CREATE TABLE "LG_transactions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES "LG_loans"(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES "LG_clients"(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES "LG_installments"(id) ON DELETE SET NULL,
  user_id UUID REFERENCES "LG_users"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment', 'loan_created', 'adjustment')),
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lg_transactions_user_id ON "LG_transactions"(user_id);
CREATE INDEX idx_lg_transactions_loan_id ON "LG_transactions"(loan_id);
CREATE INDEX idx_lg_transactions_client_id ON "LG_transactions"(client_id);
CREATE INDEX idx_lg_transactions_date ON "LG_transactions"(transaction_date);

-- Trigger: preencher user_id em LG_transactions a partir de LG_loans
CREATE OR REPLACE FUNCTION lg_fill_transaction_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loan_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := (SELECT user_id FROM "LG_loans" WHERE id = NEW.loan_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lg_transactions_user_id
  BEFORE INSERT ON "LG_transactions"
  FOR EACH ROW EXECUTE FUNCTION lg_fill_transaction_user_id();

-- ========== LG_alerts ==========
CREATE TABLE "LG_alerts" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "LG_users"(id) ON DELETE CASCADE,
  client_id UUID REFERENCES "LG_clients"(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES "LG_installments"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('due_soon', 'overdue')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lg_alerts_user_id ON "LG_alerts"(user_id);
CREATE INDEX idx_lg_alerts_installment_id ON "LG_alerts"(installment_id);
CREATE INDEX idx_lg_alerts_created_at ON "LG_alerts"(created_at);

-- ========== LG_client_documents ==========
CREATE TABLE "LG_client_documents" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES "LG_clients"(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lg_client_documents_client_id ON "LG_client_documents"(client_id);
