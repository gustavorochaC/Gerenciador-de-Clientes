import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, alertsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, UserX, Wallet, Bell, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatDate = (d: string) => {
  if (!d) return '-';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, chartRes, alertsRes] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.chart(),
          alertsApi.list(true),
        ]);
        setSummary(summaryRes.data);
        setChartData(chartRes.data);
        setAlerts(alertsRes.data.slice(0, 5));
      } catch (err) {
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-4 w-2/3 mt-2" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const kpis = [
    { label: 'Capital em Aberto', value: formatCurrency(summary?.total_outstanding || 0), icon: Wallet, color: 'text-blue-500' },
    { label: 'Recebido Este Mês', value: formatCurrency(summary?.received_this_month || 0), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Clientes Ativos', value: summary?.active_clients || 0, icon: Users, color: 'text-violet-500' },
    { label: 'Inadimplentes', value: summary?.defaulting_clients || 0, icon: UserX, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos seus empréstimos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`${kpi.color} opacity-80`}>
                  <kpi.icon className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Recebimentos Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" />
              <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend />
              <Bar dataKey="expected" name="Previsto" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="received" name="Recebido" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Due Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Parcelas Vencendo em Breve</CardTitle>
            <Badge variant="info">{summary?.due_soon?.length || 0}</Badge>
          </CardHeader>
          <CardContent>
            {(!summary?.due_soon || summary.due_soon.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma parcela vencendo nos próximos 7 dias</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.due_soon.slice(0, 5).map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.client_name}</TableCell>
                      <TableCell>{formatCurrency(Number(i.amount))}</TableCell>
                      <TableCell>{formatDate(i.due_date)}</TableCell>
                      <TableCell>
                        <Link to={`/loans/${i.loan_id}`}>
                          <Button size="sm" variant="outline">
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Parcelas em Atraso</CardTitle>
            <Badge variant="destructive">{summary?.overdue?.length || 0}</Badge>
          </CardHeader>
          <CardContent>
            {(!summary?.overdue || summary.overdue.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma parcela em atraso</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Atraso</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.overdue.slice(0, 5).map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.client_name}</TableCell>
                      <TableCell>{formatCurrency(Number(i.amount))}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{i.days_overdue} dias</Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/loans/${i.loan_id}`}>
                          <Button size="sm" variant="outline">
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alertas Recentes</CardTitle>
            <Link to="/alerts">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {alert.type === 'overdue' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <Bell className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
