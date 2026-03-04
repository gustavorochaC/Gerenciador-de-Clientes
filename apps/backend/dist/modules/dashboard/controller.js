"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = getSummary;
exports.getChartData = getChartData;
const supabase_1 = require("../../lib/supabase");
const date_1 = require("../../utils/date");
async function getSummary(req, res) {
    try {
        const today = (0, date_1.getTodayISO)();
        const sevenDaysFromNow = (0, date_1.addDays)(today, 7);
        const startOfMonth = today.substring(0, 7) + '-01';
        // Total capital outstanding (sum of pending/overdue/partial installments)
        const { data: pendingInstallments } = await supabase_1.supabase
            .from('LG_installments')
            .select('amount, paid_amount, LG_loans!inner(user_id)')
            .eq('LG_loans.user_id', req.userId)
            .in('status', ['pending', 'overdue', 'partial']);
        const totalOutstanding = (pendingInstallments || []).reduce((sum, i) => sum + (Number(i.amount) - Number(i.paid_amount)), 0);
        // Amount received this month
        const { data: monthTransactions } = await supabase_1.supabase
            .from('LG_transactions')
            .select('amount, LG_loans!inner(user_id)')
            .eq('type', 'payment')
            .eq('LG_loans.user_id', req.userId)
            .gte('transaction_date', startOfMonth)
            .lte('transaction_date', today);
        const receivedThisMonth = (monthTransactions || []).reduce((sum, t) => sum + Number(t.amount), 0);
        // Active clients count
        const { count: activeClients } = await supabase_1.supabase
            .from('LG_clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', req.userId)
            .eq('status', 'active');
        // Defaulting clients (with overdue installments)
        const { data: overdueData } = await supabase_1.supabase
            .from('LG_installments')
            .select('LG_loans!inner(client_id, user_id)')
            .eq('status', 'overdue')
            .eq('LG_loans.user_id', req.userId);
        const uniqueDefaultingClients = new Set((overdueData || []).map((i) => (i.LG_loans ?? i.loans)?.client_id));
        // Installments due in next 7 days
        const { data: dueSoon } = await supabase_1.supabase
            .from('LG_installments')
            .select(`
        *,
        LG_loans!inner(client_id, user_id, LG_clients(name))
      `)
            .eq('LG_loans.user_id', req.userId)
            .in('status', ['pending', 'partial'])
            .gte('due_date', today)
            .lte('due_date', sevenDaysFromNow)
            .order('due_date', { ascending: true });
        // All overdue installments
        const { data: overdue } = await supabase_1.supabase
            .from('LG_installments')
            .select(`
        *,
        LG_loans!inner(client_id, user_id, LG_clients(name))
      `)
            .eq('LG_loans.user_id', req.userId)
            .eq('status', 'overdue')
            .order('due_date', { ascending: true });
        // Add days_overdue to overdue installments
        const overdueWithDays = (overdue || []).map((i) => {
            const dueDate = new Date(i.due_date + 'T00:00:00');
            const todayDate = new Date(today + 'T00:00:00');
            const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            return { ...i, days_overdue: daysOverdue, client_name: (i.LG_loans ?? i.loans)?.LG_clients?.name ?? (i.LG_loans ?? i.loans)?.clients?.name };
        });
        const dueSoonFormatted = (dueSoon || []).map((i) => ({
            ...i,
            client_name: (i.LG_loans ?? i.loans)?.LG_clients?.name ?? (i.LG_loans ?? i.loans)?.clients?.name,
        }));
        return res.json({
            total_outstanding: totalOutstanding,
            received_this_month: receivedThisMonth,
            active_clients: activeClients || 0,
            defaulting_clients: uniqueDefaultingClients.size,
            due_soon: dueSoonFormatted,
            overdue: overdueWithDays,
        });
    }
    catch (error) {
        console.error('Dashboard summary error:', error);
        return res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
}
async function getChartData(req, res) {
    try {
        const today = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth();
            const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const nextMonth = new Date(year, month + 1, 1);
            const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            // Expected: sum of installments due this month
            const { data: expectedData } = await supabase_1.supabase
                .from('LG_installments')
                .select('amount, LG_loans!inner(user_id)')
                .eq('LG_loans.user_id', req.userId)
                .gte('due_date', monthStart)
                .lt('due_date', monthEnd);
            const expected = (expectedData || []).reduce((sum, i) => sum + Number(i.amount), 0);
            // Received: sum of payments this month
            const { data: receivedData } = await supabase_1.supabase
                .from('LG_transactions')
                .select('amount, LG_loans!inner(user_id)')
                .eq('type', 'payment')
                .eq('LG_loans.user_id', req.userId)
                .gte('transaction_date', monthStart)
                .lt('transaction_date', monthEnd);
            const received = (receivedData || []).reduce((sum, t) => sum + Number(t.amount), 0);
            months.push({
                month: monthStart,
                label: `${monthNames[month]}/${String(year).slice(2)}`,
                expected,
                received,
            });
        }
        return res.json(months);
    }
    catch (error) {
        console.error('Chart data error:', error);
        return res.status(500).json({ error: 'Erro ao carregar dados do gráfico' });
    }
}
//# sourceMappingURL=controller.js.map