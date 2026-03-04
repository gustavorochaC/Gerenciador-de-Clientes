import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loansApi, clientsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Landmark, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

const statusConfig: Record<string, { label: string; variant: any }> = {
  active: { label: 'Ativo', variant: 'info' },
  paid: { label: 'Pago', variant: 'success' },
  defaulted: { label: 'Inadimplente', variant: 'destructive' },
  renegotiated: { label: 'Renegociado', variant: 'warning' },
};

function calculatePreview(principal: number, rate: number, installments: number, dueDay: number, startDate: string) {
  if (!principal || !installments || !startDate) return null;
  const totalInterest = principal * (rate / 100) * installments;
  const totalAmount = principal + totalInterest;
  const installmentAmount = totalAmount / installments;

  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  let currentMonth = start.getMonth() + 1;
  let currentYear = start.getFullYear();
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }

  for (let i = 0; i < installments; i++) {
    const month = currentMonth + i;
    const year = currentYear + Math.floor(month / 12);
    const m = month % 12;
    const maxDays = new Date(year, m + 1, 0).getDate();
    const day = Math.min(dueDay || 1, maxDays);
    dates.push(`${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }

  return { totalInterest, totalAmount, installmentAmount, dates };
}

export default function LoansPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Client selection
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Loan form
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [installments, setInstallments] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await loansApi.list({ search, status: statusFilter, page, limit: 10 });
      setLoans(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch { toast.error('Erro ao buscar empréstimos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, [search, statusFilter, page]);

  useEffect(() => {
    if (showCreate) {
      clientsApi.list({ status: 'active', limit: 100 }).then(res => setClients(res.data.data)).catch(() => {});
    }
  }, [showCreate]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.cpf?.includes(clientSearch));
  }, [clients, clientSearch]);

  const preview = useMemo(() => {
    return calculatePreview(Number(principal), Number(rate), Number(installments), Number(dueDay), startDate);
  }, [principal, rate, installments, dueDay, startDate]);

  const handleCreate = async () => {
    if (!selectedClient || !principal || !rate || !installments || !dueDay || !startDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await loansApi.create({
        client_id: selectedClient.id,
        principal_amount: Number(principal),
        interest_rate: Number(rate),
        total_installments: Number(installments),
        due_day: Number(dueDay),
        start_date: startDate,
        notes: notes || null,
      });
      toast.success('Empréstimo criado com sucesso!');
      setShowCreate(false);
      resetForm();
      fetchLoans();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar empréstimo');
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setStep(1); setSelectedClient(null); setClientSearch('');
    setPrincipal(''); setRate(''); setInstallments(''); setDueDay('10');
    setStartDate(new Date().toISOString().split('T')[0]); setNotes('');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await loansApi.delete(deleteId);
      toast.success('Empréstimo removido');
      setDeleteId(null); fetchLoans();
    } catch { toast.error('Erro ao remover empréstimo'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empréstimos</h1>
          <p className="text-muted-foreground">Gerencie seus empréstimos</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Empréstimo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome do cliente..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="defaulted">Inadimplentes</SelectItem>
            <SelectItem value="renegotiated">Renegociados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : loans.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Landmark className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Nenhum empréstimo encontrado</h3>
              <p className="text-muted-foreground mb-4">Crie seu primeiro empréstimo para começar a rastrear pagamentos</p>
              <Button onClick={() => { resetForm(); setShowCreate(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Empréstimo</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Principal</TableHead>
                  <TableHead className="hidden md:table-cell">Total a Pagar</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const s = statusConfig[loan.status] || statusConfig.active;
                  return (
                    <TableRow key={loan.id} className="cursor-pointer" onClick={() => navigate(`/loans/${loan.id}`)}>
                      <TableCell className="font-medium">{loan.client_name}</TableCell>
                      <TableCell>{formatCurrency(Number(loan.principal_amount))}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatCurrency(Number(loan.total_amount))}</TableCell>
                      <TableCell>{loan.paid_installments}/{loan.total_installment_count}</TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/loans/${loan.id}`); }}>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="flex items-center text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      )}

      {/* Create Loan Sheet - Multi-step */}
      <Sheet open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); resetForm(); }}}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Empréstimo</SheetTitle>
            <SheetDescription>Passo {step} de 2</SheetDescription>
          </SheetHeader>

          {step === 1 ? (
            <div className="space-y-4 mt-6">
              <Label>Selecionar Cliente *</Label>
              <Input placeholder="Buscar cliente por nome ou CPF..." value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)} />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredClients.map((c) => (
                  <div key={c.id}
                    onClick={() => { setSelectedClient(c); setStep(2); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                      selectedClient?.id === c.id ? 'border-primary bg-accent' : ''
                    }`}>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.cpf} • {c.phone}</p>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">Nenhum cliente encontrado</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{selectedClient?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedClient?.cpf}</p>
                <Button variant="link" size="sm" className="h-auto p-0 mt-1" onClick={() => setStep(1)}>Trocar cliente</Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Valor Principal (R$) *</Label>
                  <Input type="number" step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="5000.00" />
                </div>
                <div className="space-y-2">
                  <Label>Taxa de Juros (% a.m.) *</Label>
                  <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="5.00" />
                </div>
                <div className="space-y-2">
                  <Label>Nº de Parcelas *</Label>
                  <Input type="number" min="1" max="48" value={installments} onChange={(e) => setInstallments(e.target.value)} placeholder="12" />
                </div>
                <div className="space-y-2">
                  <Label>Dia de Vencimento *</Label>
                  <Input type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data de Início *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas sobre o empréstimo..." />
              </div>

              {/* Real-time Preview */}
              {preview && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Prévia do Empréstimo</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-[11px] text-muted-foreground">Juros Total</p>
                        <p className="font-bold text-sm">{formatCurrency(preview.totalInterest)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-[11px] text-muted-foreground">Total a Pagar</p>
                        <p className="font-bold text-sm">{formatCurrency(preview.totalAmount)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-[11px] text-muted-foreground">Cada Parcela</p>
                        <p className="font-bold text-sm">{formatCurrency(preview.installmentAmount)}</p>
                      </div>
                    </div>

                    {preview.dates.length <= 12 && (
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {preview.dates.map((date, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{formatDate(date)}</TableCell>
                                <TableCell>{formatCurrency(preview.installmentAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Button className="w-full mt-4" onClick={handleCreate} disabled={saving}>
                Confirmar e Criar Empréstimo
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover empréstimo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as parcelas e registros serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
