"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstallments = getInstallments;
exports.payInstallment = payInstallment;
exports.updateInstallmentStatus = updateInstallmentStatus;
const supabase_1 = require("../../lib/supabase");
async function getInstallments(req, res) {
    try {
        const { loanId } = req.params;
        const { data: loan } = await supabase_1.supabase
            .from('LG_loans')
            .select('id')
            .eq('id', loanId)
            .eq('user_id', req.userId)
            .single();
        if (!loan) {
            return res.status(404).json({ error: 'Empréstimo não encontrado' });
        }
        const { data, error } = await supabase_1.supabase
            .from('LG_installments')
            .select('*')
            .eq('loan_id', loanId)
            .order('installment_no', { ascending: true });
        if (error)
            throw error;
        return res.json(data || []);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar parcelas' });
    }
}
async function payInstallment(req, res) {
    try {
        const { id } = req.params;
        const { paid_amount, paid_at, notes } = req.body;
        if (!paid_amount || !paid_at) {
            return res.status(400).json({ error: 'Valor e data de pagamento são obrigatórios' });
        }
        // Fetch installment
        const { data: installment, error: fetchError } = await supabase_1.supabase
            .from('LG_installments')
            .select('*, LG_loans(client_id, user_id, id, total_installments)')
            .eq('id', id)
            .single();
        if (fetchError || !installment) {
            return res.status(404).json({ error: 'Parcela não encontrada' });
        }
        // Calculate new paid amount (accumulate for partial payments)
        const newPaidAmount = Number(installment.paid_amount) + Number(paid_amount);
        const newStatus = newPaidAmount >= Number(installment.amount) ? 'paid' : 'partial';
        // Update installment
        const { data: updated, error: updateError } = await supabase_1.supabase
            .from('LG_installments')
            .update({
            paid_amount: newPaidAmount,
            paid_at,
            status: newStatus,
            notes: notes || installment.notes,
        })
            .eq('id', id)
            .select()
            .single();
        if (updateError)
            throw updateError;
        // Create transaction
        const loanRef = installment.LG_loans ?? installment.loans;
        await supabase_1.supabase.from('LG_transactions').insert({
            loan_id: installment.loan_id,
            installment_id: id,
            client_id: loanRef?.client_id,
            user_id: loanRef?.user_id ?? undefined,
            type: 'payment',
            amount: paid_amount,
            description: `Pagamento da parcela ${installment.installment_no}${newStatus === 'partial' ? ' (parcial)' : ''}`,
            transaction_date: paid_at,
        });
        // Check if all installments are paid → update loan status
        const { data: allInstallments } = await supabase_1.supabase
            .from('LG_installments')
            .select('status')
            .eq('loan_id', installment.loan_id);
        const allPaid = allInstallments?.every(i => i.status === 'paid');
        if (allPaid) {
            await supabase_1.supabase
                .from('LG_loans')
                .update({ status: 'paid' })
                .eq('id', installment.loan_id);
        }
        return res.json(updated);
    }
    catch (error) {
        console.error('Pay installment error:', error);
        return res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }
}
async function updateInstallmentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['pending', 'paid', 'overdue', 'partial'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }
        const { data: installment } = await supabase_1.supabase
            .from('LG_installments')
            .select('id, LG_loans!inner(user_id)')
            .eq('id', id)
            .eq('LG_loans.user_id', req.userId)
            .single();
        if (!installment) {
            return res.status(404).json({ error: 'Parcela não encontrada' });
        }
        const { data, error } = await supabase_1.supabase
            .from('LG_installments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ error: 'Parcela não encontrada' });
        return res.json(data);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao atualizar status' });
    }
}
//# sourceMappingURL=controller.js.map