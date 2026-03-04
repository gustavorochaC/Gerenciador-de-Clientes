import { z } from 'zod';

// ========== AUTH ==========
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ========== CLIENTS ==========
export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().regex(cpfRegex, 'CPF inválido. Use o formato 000.000.000-00'),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const clientStatusValues = ['active', 'inactive'] as const;
export type ClientStatus = (typeof clientStatusValues)[number];

// ========== LOANS ==========
export const createLoanSchema = z.object({
  client_id: z.string().uuid('ID do cliente inválido'),
  principal_amount: z.number().positive('Valor principal deve ser positivo'),
  interest_rate: z.number().min(0, 'Taxa de juros deve ser >= 0').max(100, 'Taxa de juros deve ser <= 100'),
  total_installments: z.number().int().min(1, 'Mínimo 1 parcela').max(48, 'Máximo 48 parcelas'),
  due_day: z.number().int().min(1, 'Dia mínimo: 1').max(28, 'Dia máximo: 28'),
  start_date: z.string().min(1, 'Data de início obrigatória'),
  notes: z.string().optional().nullable(),
});

export const updateLoanSchema = createLoanSchema.partial().omit({ client_id: true });

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;

export const loanStatusValues = ['active', 'paid', 'defaulted', 'renegotiated'] as const;
export type LoanStatus = (typeof loanStatusValues)[number];

// ========== INSTALLMENTS ==========
export const payInstallmentSchema = z.object({
  paid_amount: z.number().positive('Valor deve ser positivo'),
  paid_at: z.string().min(1, 'Data de pagamento obrigatória'),
  notes: z.string().optional().nullable(),
});

export type PayInstallmentInput = z.infer<typeof payInstallmentSchema>;

export const installmentStatusValues = ['pending', 'paid', 'overdue', 'partial'] as const;
export type InstallmentStatus = (typeof installmentStatusValues)[number];

// ========== TRANSACTIONS ==========
export const transactionTypeValues = ['payment', 'loan_created', 'adjustment'] as const;
export type TransactionType = (typeof transactionTypeValues)[number];

// ========== ALERTS ==========
export const alertTypeValues = ['due_soon', 'overdue'] as const;
export type AlertType = (typeof alertTypeValues)[number];

// ========== CALCULATOR ==========
export function calculateLoan(principal: number, rate: number, installments: number) {
  const totalInterest = principal * (rate / 100) * installments;
  const totalAmount = principal + totalInterest;
  const installmentAmount = totalAmount / installments;
  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    installmentAmount: Math.round(installmentAmount * 100) / 100,
  };
}

// ========== FORMATTERS ==========
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function maskCPF(cpf: string): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `***.***.*${digits[8]}${digits[9]}-${digits[9]}${digits[10]}`;
}
