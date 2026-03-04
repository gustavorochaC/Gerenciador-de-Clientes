import { Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthRequest } from '../../middleware/auth';
import { calculateLoan, generateInstallmentDates } from '../../utils/calculator';

export async function getLoans(req: AuthRequest, res: Response) {
  try {
    const { client_id, status, start_date, end_date, page = '1', limit = '10', search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('LG_loans')
      .select(`
        *,
        LG_clients!inner(name, cpf),
        LG_installments(id, status, paid_amount)
      `, { count: 'exact' })
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (client_id) query = query.eq('client_id', client_id);
    if (status && status !== 'all') query = query.eq('status', status);
    if (start_date) query = query.gte('start_date', start_date);
    if (end_date) query = query.lte('start_date', end_date);
    if (search) query = query.ilike('LG_clients.name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const loans = (data || []).map((loan: any) => {
      const inst = loan.LG_installments ?? loan.installments;
      const paidCount = inst?.filter((i: any) => i.status === 'paid').length || 0;
      const totalInst = inst?.length || 0;
      // Find next due installment
      const pendingInstallments = inst?.filter((i: any) => 
        i.status === 'pending' || i.status === 'overdue' || i.status === 'partial'
      ) || [];
      
      return {
        ...loan,
        client_name: (loan.LG_clients ?? loan.clients)?.name,
        client_cpf: (loan.LG_clients ?? loan.clients)?.cpf,
        paid_installments: paidCount,
        total_installment_count: totalInst,
        installments: undefined,
        clients: undefined,
        LG_installments: undefined,
        LG_clients: undefined,
      };
    });

    return res.json({
      data: loans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get loans error:', error);
    return res.status(500).json({ error: 'Erro ao buscar empréstimos' });
  }
}

export async function getLoan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('LG_loans')
      .select(`
        *,
        LG_clients(name, cpf, phone),
        LG_installments(*)
      `)
      .eq('id', id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }

    const inst = data.LG_installments ?? data.installments;
    if (inst) {
      inst.sort((a: any, b: any) => a.installment_no - b.installment_no);
      data.installments = inst;
    }
    if (data.LG_clients) data.clients = data.LG_clients;
    delete data.LG_installments;
    delete data.LG_clients;

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar empréstimo' });
  }
}

export async function createLoan(req: AuthRequest, res: Response) {
  try {
    const { client_id, principal_amount, interest_rate, total_installments, due_day, start_date, notes } = req.body;

    if (!client_id || !principal_amount || interest_rate === undefined || !total_installments || !due_day || !start_date) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Calculate loan values
    const calc = calculateLoan(principal_amount, interest_rate, total_installments);

    // Insert loan
    const { data: loan, error: loanError } = await supabase
      .from('LG_loans')
      .insert({
        client_id,
        user_id: req.userId,
        principal_amount,
        interest_rate,
        total_installments,
        installment_amount: calc.installmentAmount,
        total_amount: calc.totalAmount,
        start_date,
        due_day,
        notes: notes || null,
      })
      .select()
      .single();

    if (loanError) throw loanError;

    // Generate installment dates
    const dates = generateInstallmentDates(start_date, due_day, total_installments);

    // Create installment rows
    const installmentRows = dates.map((date, index) => ({
      loan_id: loan.id,
      installment_no: index + 1,
      due_date: date,
      amount: calc.installmentAmount,
      status: 'pending',
      paid_amount: 0,
    }));

    const { error: instError } = await supabase
      .from('LG_installments')
      .insert(installmentRows);

    if (instError) throw instError;

    // Create transaction log
    await supabase.from('LG_transactions').insert({
      loan_id: loan.id,
      client_id,
      user_id: req.userId ?? undefined,
      type: 'loan_created',
      amount: calc.totalAmount,
      description: `Empréstimo criado: ${total_installments}x de R$ ${calc.installmentAmount.toFixed(2)}`,
      transaction_date: start_date,
    });

    // Fetch complete loan with installments
    const { data: completeLoan } = await supabase
      .from('LG_loans')
      .select('*, LG_installments(*), LG_clients(name)')
      .eq('id', loan.id)
      .single();

    if (completeLoan) {
      completeLoan.installments = completeLoan.LG_installments;
      completeLoan.clients = completeLoan.LG_clients;
      delete completeLoan.LG_installments;
      delete completeLoan.LG_clients;
    }
    return res.status(201).json(completeLoan);
  } catch (error) {
    console.error('Create loan error:', error);
    return res.status(500).json({ error: 'Erro ao criar empréstimo' });
  }
}

export async function updateLoan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('LG_loans')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Empréstimo não encontrado' });

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar empréstimo' });
  }
}

export async function updateLoanStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'paid', 'defaulted', 'renegotiated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const { data, error } = await supabase
      .from('LG_loans')
      .update({ status })
      .eq('id', id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Empréstimo não encontrado' });

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar status' });
  }
}

export async function deleteLoan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('LG_loans')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId!);

    if (error) throw error;

    return res.json({ message: 'Empréstimo removido com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover empréstimo' });
  }
}
