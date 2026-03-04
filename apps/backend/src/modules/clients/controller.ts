import { Response } from 'express';
import { supabase } from '../../lib/supabase';
import { AuthRequest } from '../../middleware/auth';

export async function getClients(req: AuthRequest, res: Response) {
  try {
    const { search, status, page = '1', limit = '10' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('LG_clients')
      .select('*, LG_loans(id, status)', { count: 'exact' })
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      const s = String(search);
      query = query.or(`name.ilike.%${s}%,cpf.ilike.%${s}%,phone.ilike.%${s}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const clients = (data || []).map((c: any) => ({
      ...c,
      active_loans_count: (c.LG_loans ?? c.loans)?.filter((l: any) => l.status === 'active').length || 0,
      loans: undefined,
      LG_loans: undefined,
    }));

    return res.json({
      data: clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    return res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
}

export async function getClient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('LG_clients')
      .select(`
        *,
        LG_loans(*, LG_installments(*)),
        LG_client_documents(*)
      `)
      .eq('id', id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const out: any = { ...data };
    if (out.LG_loans) {
      out.loans = out.LG_loans.map((l: any) => ({ ...l, installments: l.LG_installments ?? l.installments }));
      delete out.LG_loans;
    }
    if (out.LG_client_documents) {
      out.client_documents = out.LG_client_documents;
      delete out.LG_client_documents;
    }
    return res.json(out);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
}

export async function createClient(req: AuthRequest, res: Response) {
  try {
    const { name, phone, cpf, address, notes } = req.body;

    if (!name || !phone || !cpf) {
      return res.status(400).json({ error: 'Nome, telefone e CPF são obrigatórios' });
    }

    // Check for duplicate CPF
    const { data: existing } = await supabase
      .from('LG_clients')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Já existe um cliente com este CPF' });
    }

    const { data, error } = await supabase
      .from('LG_clients')
      .insert({
        user_id: req.userId,
        name,
        phone,
        cpf,
        address: address || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ error: 'Erro ao criar cliente' });
  }
}

export async function updateClient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('LG_clients')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Cliente não encontrado' });

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
}

export async function deleteClient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('LG_clients')
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Cliente não encontrado' });

    return res.json({ message: 'Cliente desativado com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao desativar cliente' });
  }
}

export async function uploadDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { file_name, file_url, file_type } = req.body;

    const { data, error } = await supabase
      .from('LG_client_documents')
      .insert({
        client_id: id,
        file_name,
        file_url,
        file_type: file_type || 'document',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao enviar documento' });
  }
}

export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    const { docId } = req.params;

    const { error } = await supabase
      .from('LG_client_documents')
      .delete()
      .eq('id', docId);

    if (error) throw error;

    return res.json({ message: 'Documento removido com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover documento' });
  }
}
