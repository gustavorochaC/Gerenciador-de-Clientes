"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlerts = getAlerts;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
const supabase_1 = require("../../lib/supabase");
async function getAlerts(req, res) {
    try {
        const { unread_only } = req.query;
        let query = supabase_1.supabase
            .from('LG_alerts')
            .select(`
        *,
        LG_clients(name),
        LG_installments(loan_id, installment_no, due_date, amount)
      `)
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        const normalized = (data || []).map((a) => {
            const out = { ...a };
            if (out.LG_clients) {
                out.clients = out.LG_clients;
                delete out.LG_clients;
            }
            if (out.LG_installments) {
                out.installments = out.LG_installments;
                delete out.LG_installments;
            }
            return out;
        });
        return res.json(normalized);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar alertas' });
    }
}
async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const { data, error } = await supabase_1.supabase
            .from('LG_alerts')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', req.userId)
            .select()
            .single();
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao marcar alerta como lido' });
    }
}
async function markAllAsRead(req, res) {
    try {
        const { error } = await supabase_1.supabase
            .from('LG_alerts')
            .update({ is_read: true })
            .eq('user_id', req.userId)
            .eq('is_read', false);
        if (error)
            throw error;
        return res.json({ message: 'Todos os alertas foram marcados como lidos' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao marcar alertas como lidos' });
    }
}
//# sourceMappingURL=controller.js.map