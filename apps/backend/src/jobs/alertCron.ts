import cron from 'node-cron';
import { supabase } from '../lib/supabase';
import { getTodayISO, addDays } from '../utils/date';

/** Executa a lógica do job de alertas. Usado por node-cron (dev) e pela rota POST /api/cron/run-alerts (Vercel). */
export async function runAlertJob(): Promise<void> {
  console.log('🔔 Running daily alert job...');

  const today = getTodayISO();
  const threeDaysAhead = addDays(today, 3);
  const tomorrow = addDays(today, 1);

  const { data: loansByUser } = await supabase
    .from('LG_loans')
    .select('user_id')
    .limit(5000);
  const userIds = [...new Set((loansByUser || []).map((r: { user_id: string }) => r.user_id))];
  if (userIds.length === 0) return;

  for (const userId of userIds) {
    // 1. Parcelas a vencer entre amanhã e daqui 3 dias → alertas due_soon
    const { data: dueSoon } = await supabase
      .from('LG_installments')
      .select(
        `
        id, due_date, amount, installment_no,
        LG_loans!inner(client_id, user_id, LG_clients(name))
      `
      )
      .eq('LG_loans.user_id', userId)
      .in('status', ['pending', 'partial'])
      .gte('due_date', tomorrow)
      .lte('due_date', threeDaysAhead);

    for (const inst of dueSoon || []) {
      const loanRef = (inst as any).LG_loans;
      const clientName = loanRef?.LG_clients?.name ?? 'Cliente';
      const clientId = loanRef?.client_id;

      const { data: existing } = await supabase
        .from('LG_alerts')
        .select('id')
        .eq('installment_id', inst.id)
        .eq('type', 'due_soon')
        .gte('created_at', today + 'T00:00:00')
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('LG_alerts').insert({
          user_id: userId,
          client_id: clientId,
          installment_id: inst.id,
          type: 'due_soon',
          message: `Parcela ${inst.installment_no} de ${clientName} vence em ${inst.due_date}`,
        });
      }
    }

    // 2. Parcelas pendentes com due_date antes de hoje → marcar overdue e criar alerta
    const { data: overdue } = await supabase
      .from('LG_installments')
      .select(
        `
        id, due_date, amount, installment_no,
        LG_loans!inner(client_id, user_id, LG_clients(name))
      `
      )
      .eq('LG_loans.user_id', userId)
      .eq('status', 'pending')
      .lt('due_date', today);

    for (const inst of overdue || []) {
      await supabase.from('LG_installments').update({ status: 'overdue' }).eq('id', inst.id);

      const loanRef = (inst as any).LG_loans;
      const clientName = loanRef?.LG_clients?.name ?? 'Cliente';
      const clientId = loanRef?.client_id;

      const { data: existing } = await supabase
        .from('LG_alerts')
        .select('id')
        .eq('installment_id', inst.id)
        .eq('type', 'overdue')
        .gte('created_at', today + 'T00:00:00')
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('LG_alerts').insert({
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

/** Agenda o job diariamente (meia-noite). Só usado em ambiente não-Vercel. */
export function startAlertCron(): void {
  cron.schedule('0 0 * * *', async () => {
    try {
      await runAlertJob();
    } catch (error) {
      console.error('❌ Alert cron error:', error);
    }
  });
  console.log('⏰ Alert cron job scheduled (daily at midnight)');
}
