"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientReport = getClientReport;
exports.getGeneralReport = getGeneralReport;
const supabase_1 = require("../../lib/supabase");
async function getClientReport(req, res) {
    try {
        const { id } = req.params;
        const { data: client, error } = await supabase_1.supabase
            .from('LG_clients')
            .select(`
        *,
        LG_loans(*, LG_installments(*))
      `)
            .eq('id', id)
            .eq('user_id', req.userId)
            .single();
        if (error || !client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        // Calculate summary
        let totalLoaned = 0;
        let totalPaid = 0;
        let totalOutstanding = 0;
        ((client.LG_loans ?? client.loans) || []).forEach((loan) => {
            totalLoaned += Number(loan.total_amount);
            ((loan.LG_installments ?? loan.installments) || []).forEach((inst) => {
                totalPaid += Number(inst.paid_amount);
            });
        });
        totalOutstanding = totalLoaned - totalPaid;
        return res.json({
            client: {
                name: client.name,
                cpf: client.cpf,
                phone: client.phone,
                address: client.address,
            },
            loans: ((client.LG_loans ?? client.loans) || []).map((loan) => ({
                ...loan,
                installments: ((loan.LG_installments ?? loan.installments) || []).sort((a, b) => a.installment_no - b.installment_no),
            })),
            summary: {
                total_loaned: totalLoaned,
                total_paid: totalPaid,
                total_outstanding: totalOutstanding,
            },
        });
    }
    catch (error) {
        console.error('Client report error:', error);
        return res.status(500).json({ error: 'Erro ao gerar relatório do cliente' });
    }
}
async function getGeneralReport(req, res) {
    try {
        const { start_date, end_date } = req.query;
        // Active loans with client info
        const { data: loans } = await supabase_1.supabase
            .from('LG_loans')
            .select(`
        *,
        LG_clients(name),
        LG_installments(*)
      `)
            .eq('user_id', req.userId)
            .eq('status', 'active');
        // Payments received in date range
        let transQuery = supabase_1.supabase
            .from('LG_transactions')
            .select(`
        *,
        LG_clients(name),
        LG_installments(installment_no)
      `)
            .eq('type', 'payment')
            .eq('user_id', req.userId)
            .order('transaction_date', { ascending: false });
        if (start_date)
            transQuery = transQuery.gte('transaction_date', start_date);
        if (end_date)
            transQuery = transQuery.lte('transaction_date', end_date);
        const { data: payments } = await transQuery;
        // Defaulting clients with overdue installments
        const { data: overdueInstallments } = await supabase_1.supabase
            .from('LG_installments')
            .select(`
        *,
        LG_loans!inner(client_id, user_id, principal_amount, LG_clients(name))
      `)
            .eq('status', 'overdue')
            .eq('LG_loans.user_id', req.userId);
        // Calculate totals
        let totalLoaned = 0, totalReceived = 0, totalOutstanding = 0, totalOverdue = 0;
        (loans || []).forEach((loan) => {
            totalLoaned += Number(loan.total_amount);
            ((loan.LG_installments ?? loan.installments) || []).forEach((i) => {
                totalReceived += Number(i.paid_amount);
                if (i.status === 'pending' || i.status === 'overdue' || i.status === 'partial') {
                    totalOutstanding += Number(i.amount) - Number(i.paid_amount);
                }
                if (i.status === 'overdue') {
                    totalOverdue += Number(i.amount) - Number(i.paid_amount);
                }
            });
        });
        const today = new Date().toISOString().split('T')[0];
        const overdueFormatted = (overdueInstallments || []).map((i) => {
            const dueDate = new Date(i.due_date + 'T00:00:00');
            const todayDate = new Date(today + 'T00:00:00');
            const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            return {
                client_name: (i.LG_loans ?? i.loans)?.LG_clients?.name ?? (i.LG_loans ?? i.loans)?.clients?.name,
                loan_id: (i.LG_loans ?? i.loans)?.id,
                installment_no: i.installment_no,
                due_date: i.due_date,
                days_overdue: daysOverdue,
                amount: Number(i.amount) - Number(i.paid_amount),
            };
        });
        return res.json({
            summary: {
                total_loaned: totalLoaned,
                total_received: totalReceived,
                total_outstanding: totalOutstanding,
                total_overdue: totalOverdue,
            },
            active_loans: (loans || []).map((loan) => {
                const paidSum = ((loan.LG_installments ?? loan.installments) || []).reduce((s, i) => s + Number(i.paid_amount), 0);
                return {
                    client_name: (loan.LG_clients ?? loan.clients)?.name,
                    principal_amount: loan.principal_amount,
                    interest_rate: loan.interest_rate,
                    total_installments: loan.total_installments,
                    received: paidSum,
                    balance: Number(loan.total_amount) - paidSum,
                    status: loan.status,
                };
            }),
            payments: (payments || []).map((p) => ({
                date: p.transaction_date,
                client_name: (p.LG_clients ?? p.clients)?.name,
                installment_no: (p.LG_installments ?? p.installments)?.installment_no,
                amount: p.amount,
            })),
            defaulting: overdueFormatted,
        });
    }
    catch (error) {
        console.error('General report error:', error);
        return res.status(500).json({ error: 'Erro ao gerar relatório geral' });
    }
}
//# sourceMappingURL=controller.js.map