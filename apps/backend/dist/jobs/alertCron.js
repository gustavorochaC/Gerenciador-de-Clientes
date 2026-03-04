"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAlertCron = startAlertCron;
const node_cron_1 = __importDefault(require("node-cron"));
const supabase_1 = require("../lib/supabase");
const date_1 = require("../utils/date");
function startAlertCron() {
    // Run daily at midnight
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('🔔 Running daily alert job...');
        try {
            const today = (0, date_1.getTodayISO)();
            const threeDaysAhead = (0, date_1.addDays)(today, 3);
            const tomorrow = (0, date_1.addDays)(today, 1);
            // Usuários que têm empréstimos (auth.users via LG_loans)
            const { data: loansByUser } = await supabase_1.supabase
                .from('LG_loans')
                .select('user_id')
                .limit(5000);
            const userIds = [...new Set((loansByUser || []).map((r) => r.user_id))];
            if (userIds.length === 0)
                return;
            for (const userId of userIds) {
                // 1. Parcelas a vencer entre amanhã e daqui 3 dias → alertas due_soon
                const { data: dueSoon } = await supabase_1.supabase
                    .from('LG_installments')
                    .select(`
            id, due_date, amount, installment_no,
            LG_loans!inner(client_id, user_id, LG_clients(name))
          `)
                    .eq('LG_loans.user_id', userId)
                    .in('status', ['pending', 'partial'])
                    .gte('due_date', tomorrow)
                    .lte('due_date', threeDaysAhead);
                for (const inst of dueSoon || []) {
                    const loanRef = inst.LG_loans;
                    const clientName = loanRef?.LG_clients?.name ?? 'Cliente';
                    const clientId = loanRef?.client_id;
                    const { data: existing } = await supabase_1.supabase
                        .from('LG_alerts')
                        .select('id')
                        .eq('installment_id', inst.id)
                        .eq('type', 'due_soon')
                        .gte('created_at', today + 'T00:00:00')
                        .limit(1);
                    if (!existing || existing.length === 0) {
                        await supabase_1.supabase.from('LG_alerts').insert({
                            user_id: userId,
                            client_id: clientId,
                            installment_id: inst.id,
                            type: 'due_soon',
                            message: `Parcela ${inst.installment_no} de ${clientName} vence em ${inst.due_date}`,
                        });
                    }
                }
                // 2. Parcelas pendentes com due_date antes de hoje → marcar overdue e criar alerta
                const { data: overdue } = await supabase_1.supabase
                    .from('LG_installments')
                    .select(`
            id, due_date, amount, installment_no,
            LG_loans!inner(client_id, user_id, LG_clients(name))
          `)
                    .eq('LG_loans.user_id', userId)
                    .eq('status', 'pending')
                    .lt('due_date', today);
                for (const inst of overdue || []) {
                    await supabase_1.supabase.from('LG_installments').update({ status: 'overdue' }).eq('id', inst.id);
                    const loanRef = inst.LG_loans;
                    const clientName = loanRef?.LG_clients?.name ?? 'Cliente';
                    const clientId = loanRef?.client_id;
                    const { data: existing } = await supabase_1.supabase
                        .from('LG_alerts')
                        .select('id')
                        .eq('installment_id', inst.id)
                        .eq('type', 'overdue')
                        .gte('created_at', today + 'T00:00:00')
                        .limit(1);
                    if (!existing || existing.length === 0) {
                        await supabase_1.supabase.from('LG_alerts').insert({
                            user_id: userId,
                            client_id: clientId,
                            installment_id: inst.id,
                            type: 'overdue',
                            message: `Parcela ${inst.installment_no} de ${clientName} está em atraso desde ${inst.due_date}`,
                        });
                    }
                }
            }
            console.log(`✅ Alert job done for ${userIds.length} user(s)`);
        }
        catch (error) {
            console.error('❌ Alert cron error:', error);
        }
    });
    console.log('⏰ Alert cron job scheduled (daily at midnight)');
}
//# sourceMappingURL=alertCron.js.map