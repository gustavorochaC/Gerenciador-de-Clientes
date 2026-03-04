import { Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthRequest } from '../../middleware/auth';

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const { client_id, loan_id, type, page = '1', limit = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('LG_transactions')
      .select(`
        *,
        LG_clients(name),
        LG_loans(principal_amount),
        LG_installments(installment_no)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (req.userId) query = query.eq('user_id', req.userId);
    if (client_id) query = query.eq('client_id', client_id);
    if (loan_id) query = query.eq('loan_id', loan_id);
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;
    if (error) throw error;

    const normalized = (data || []).map((t: any) => {
      const out = { ...t };
      if (out.LG_clients) { out.clients = out.LG_clients; delete out.LG_clients; }
      if (out.LG_loans) { out.loans = out.LG_loans; delete out.LG_loans; }
      if (out.LG_installments) { out.installments = out.LG_installments; delete out.LG_installments; }
      return out;
    });

    return res.json({
      data: normalized,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar transações' });
  }
}
