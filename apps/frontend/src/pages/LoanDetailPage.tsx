import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loansApi, installmentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, DollarSign, Calendar, Percent, Hash } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

const statusConfig: Record<string, { label: string; variant: any }> = {
  active: { label: 'Ativo', variant: 'info' },
  paid: { label: 'Pago', variant: 'success' },
  defaulted: { label: 'Inadimplente', variant: 'destructive' },
  renegotiated: { label: 'Renegociado', variant: 'warning' },
  pending: { label: 'Pendente', variant: 'secondary' },
  overdue: { label: 'Atrasada', variant: 'destructive' },
  partial: { label: 'Parcial', variant: 'warning' },
};

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payDialog, setPayDialog] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchLoan = async () => {
    try {
      const res = await loansApi.get(id!);
      setLoan(res.data);
    } catch { toast.error('Erro ao carregar empréstimo'); navigate('/loans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLoan(); }, [id]);

  const handlePay = async () => {
    if (!payAmount || !payDate) { toast.error('Preencha valor e data'); return; }
    setPaying(true);
    try {
      await installmentsApi.pay(payDialog.id, {
        paid_amount: Number(payAmount),
        paid_at: payDate,
        notes: payNotes || null,
      });
      toast.success('Pagamento registrado com sucesso!');
      setPayDialog(null);
      setPayAmount(''); setPayDate(new Date().toISOString().split('T')[0]); setPayNotes('');
      fetchLoan();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao registrar pagamento');
    } finally { setPaying(false); }
  };

  const openPayDialog = (installment: any) => {
    setPayDialog(installment);
    setPayAmount(String(Number(installment.amount) - Number(installment.paid_amount)));
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNotes('');
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!loan) return null;

  const s = statusConfig[loan.status] || statusConfig.active;
  const installments = loan.installments || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/loans')}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display">{loan.clients?.name}</h1>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(Number(loan.principal_amount))}</span>
            <span className="flex items-center gap-1"><Percent className="w-3 h-3" />{loan.interest_rate}% a.m.</span>
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{loan.total_installments} parcelas</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(loan.start_date)}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '50ms' }}><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total a Pagar</p><p className="text-xl font-bold mt-1 font-display">{formatCurrency(Number(loan.total_amount))}</p></CardContent></Card>
        <Card className="shadow-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '100ms' }}><CardContent className="p-4"><p className="text-sm text-muted-foreground">Valor da Parcela</p><p className="text-xl font-bold mt-1 font-display">{formatCurrency(Number(loan.installment_amount))}</p></CardContent></Card>
        <Card className="shadow-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '150ms' }}><CardContent className="p-4"><p className="text-sm text-muted-foreground">Parcelas Pagas</p><p className="text-xl font-bold mt-1 text-chart-2">{installments.filter((i: any) => i.status === 'paid').length}/{loan.total_installments}</p></CardContent></Card>
        <Card className="shadow-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '200ms' }}><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Recebido</p><p className="text-xl font-bold mt-1 text-chart-2">{formatCurrency(installments.reduce((s: number, i: any) => s + Number(i.paid_amount), 0))}</p></CardContent></Card>
      </div>

      {/* Installments Table */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display">Parcelas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Valor Pago</TableHead>
                <TableHead className="hidden md:table-cell">Pago Em</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((inst: any) => {
                const is = statusConfig[inst.status] || statusConfig.pending;
                const today = new Date().toISOString().split('T')[0];
                const daysOverdue = inst.status === 'overdue' ?
                  Math.floor((new Date(today + 'T00:00:00').getTime() - new Date(inst.due_date + 'T00:00:00').getTime()) / 86400000) : 0;
                return (
                  <TableRow key={inst.id} className="transition-colors duration-150 hover:bg-muted/60">
                    <TableCell className="font-medium">{inst.installment_no}</TableCell>
                    <TableCell>{formatDate(inst.due_date)}</TableCell>
                    <TableCell>{formatCurrency(Number(inst.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={is.variant}>
                        {is.label}
                        {daysOverdue > 0 && ` (${daysOverdue}d)`}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {Number(inst.paid_amount) > 0 ? formatCurrency(Number(inst.paid_amount)) : '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {inst.paid_at ? formatDate(inst.paid_at) : '-'}
                    </TableCell>
                    <TableCell>
                      {(inst.status === 'pending' || inst.status === 'overdue' || inst.status === 'partial') && (
                        <Button size="sm" variant="outline" onClick={() => openPayDialog(inst)}>
                          Pagar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>Parcela {payDialog?.installment_no} — Vencimento: {formatDate(payDialog?.due_date)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex justify-between"><span>Valor da Parcela:</span><span className="font-medium">{formatCurrency(Number(payDialog?.amount || 0))}</span></div>
              {Number(payDialog?.paid_amount || 0) > 0 && (
                <div className="flex justify-between mt-1"><span>Já Pago:</span><span className="font-medium text-chart-2">{formatCurrency(Number(payDialog?.paid_amount))}</span></div>
              )}
              <div className="flex justify-between mt-1"><span>Restante:</span><span className="font-bold">{formatCurrency(Number(payDialog?.amount || 0) - Number(payDialog?.paid_amount || 0))}</span></div>
            </div>
            <div className="space-y-2">
              <Label>Valor Recebido (R$)</Label>
              <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Notas sobre o pagamento..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancelar</Button>
            <Button onClick={handlePay} disabled={paying}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
