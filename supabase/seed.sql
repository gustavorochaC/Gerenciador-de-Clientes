-- ============================================
-- LoanTrack — Seed Data
-- Admin user: admin@loantrack.com / admin123
-- ============================================
-- Password hash generated with bcrypt (10 rounds) for "admin123"
INSERT INTO users (id, email, password_hash, name)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@loantrack.com',
  '$2a$10$rQEY7GBsh6kXmhU6VBYQ4.6VGfFD0nVPhJyqcsN6pMEM/L6KJjjGe',
  'Administrador'
);
