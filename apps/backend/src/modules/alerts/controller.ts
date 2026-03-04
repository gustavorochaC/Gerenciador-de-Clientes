import { Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthRequest } from '../../middleware/auth';

export async function getAlerts(req: AuthRequest, res: Response) {
  try {
    const { unread_only } = req.query;

    let query = supabase
      .from('LG_alerts')
      .select(`
        *,
        LG_clients(name),
        LG_installments(loan_id, installment_no, due_date, amount)
      `)
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    const normalized = (data || []).map((a: any) => {
      const out = { ...a };
      if (out.LG_clients) { out.clients = out.LG_clients; delete out.LG_clients; }
      if (out.LG_installments) { out.installments = out.LG_installments; delete out.LG_installments; }
      return out;
    });
    return res.json(normalized);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('LG_alerts')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao marcar alerta como lido' });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    const { error } = await supabase
      .from('LG_alerts')
      .update({ is_read: true })
      .eq('user_id', req.userId!)
      .eq('is_read', false);

    if (error) throw error;

    return res.json({ message: 'Todos os alertas foram marcados como lidos' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao marcar alertas como lidos' });
  }
}
