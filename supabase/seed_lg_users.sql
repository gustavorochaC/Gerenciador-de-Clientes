-- ============================================
-- LoanTrack — Primeiro usuário para login (tabela LG_users)
-- ============================================
-- Email: admin@loantrack.com
-- Senha: admin123
-- (hash bcrypt, 10 rounds)
-- ============================================

INSERT INTO "LG_users" (id, email, name, password_hash)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@loantrack.com',
  'Administrador',
  '$2a$10$rQEY7GBsh6kXmhU6VBYQ4.6VGfFD0nVPhJyqcsN6pMEM/L6KJjjGe'
)
ON CONFLICT (email) DO NOTHING;
