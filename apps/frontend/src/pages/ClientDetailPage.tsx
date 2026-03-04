import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientsApi, loansApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Phone, CreditCard, ArrowLeft, Plus, MessageCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

const statusConfig: Record<string, { label: string; variant: any }> = {
  active: { label: 'Ativo', variant: 'info' },
  paid: { label: 'Pago', variant: 'success' },
  defaulted: { label: 'Inadimplente', variant: 'destructive' },
  renegotiated: { label: 'Renegociado', variant: 'warning' },
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await clientsApi.get(id!);
        setClient(res.data);
      } catch { toast.error('Erro ao carregar cliente'); navigate('/clients'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!client) return null;

  const loans = client.loans || [];
  const totalLoaned = loans.reduce((s: number, l: any) => s + Number(l.total_amount), 0);
  const totalPaid = loans.reduce((s: number, l: any) => s + (l.installments || []).reduce((si: number, i: any) => si + Number(i.paid_amount), 0), 0);
  const totalOutstanding = totalLoaned - totalPaid;
  const overdueCount = loans.reduce((s: number, l: any) => s + (l.installments || []).filter((i: any) => i.status === 'overdue').length, 0);

  const phoneClean = client.phone?.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${phoneClean}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <Badge variant={client.status === 'active' ? 'success' : 'secondary'}>
              {client.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> ***.***.***-{client.cpf?.slice(-2)}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-500 hover:underline">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
          </div>
        </div>
        <Link to="/loans">
          <Button><Plus className="w-4 h-4 mr-2" /> Novo Empréstimo</Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="loans">Empréstimos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Emprestado</p><p className="text-xl font-bold mt-1">{formatCurrency(totalLoaned)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Pago</p><p className="text-xl font-bold mt-1 text-emerald-500">{formatCurrency(totalPaid)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Saldo Devedor</p><p className="text-xl font-bold mt-1">{formatCurrency(totalOutstanding)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Parcelas em Atraso</p><p className="text-xl font-bold mt-1 text-red-500">{overdueCount}</p></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum empréstimo registrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Valor</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan: any) => {
                      const paid = (loan.installments || []).filter((i: any) => i.status === 'paid').length;
                      const s = statusConfig[loan.status] || statusConfig.active;
                      return (
                        <TableRow key={loan.id} className="cursor-pointer" onClick={() => navigate(`/loans/${loan.id}`)}>
                          <TableCell className="font-medium">{formatCurrency(Number(loan.principal_amount))}</TableCell>
                          <TableCell>{paid}/{loan.total_installments}</TableCell>
                          <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(loan.start_date)}</TableCell>
                          <TableCell><Button size="sm" variant="ghost">Ver</Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {loans.flatMap((loan: any) =>
                  (loan.installments || []).filter((i: any) => i.status === 'paid').map((i: any) => ({
                    ...i,
                    loan_principal: loan.principal_amount,
                  }))
                ).sort((a: any, b: any) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())
                .slice(0, 20)
                .map((i: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Parcela {i.installment_no} paga</p>
                      <p className="text-xs text-muted-foreground">{formatDate(i.paid_at)}</p>
                    </div>
                    <p className="font-semibold text-emerald-500">{formatCurrency(Number(i.paid_amount))}</p>
                  </div>
                ))}
                {loans.flatMap((l: any) => (l.installments || []).filter((i: any) => i.status === 'paid')).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Nenhum pagamento registrado</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">Upload de documentos disponível em breve</p>
                <p className="text-xs">Aceita JPG, PNG e PDF (até 5MB)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
