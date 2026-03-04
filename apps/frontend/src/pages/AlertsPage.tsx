import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alertsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, AlertTriangle, CheckCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await alertsApi.list();
      setAlerts(res.data);
    } catch { toast.error('Erro ao carregar alertas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleMarkAllRead = async () => {
    try {
      await alertsApi.markAllAsRead();
      toast.success('Todos os alertas marcados como lidos');
      fetchAlerts();
    } catch { toast.error('Erro ao marcar alertas como lidos'); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await alertsApi.markAsRead(id);
      fetchAlerts();
    } catch {}
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">Alertas</h1>
          <p className="text-muted-foreground">{unreadCount} alertas não lidos</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" /> Marcar Todos Como Lidos
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card className="shadow-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards]">
          <CardContent className="py-16 text-center">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum alerta</h3>
            <p className="text-muted-foreground">Você não possui alertas no momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`shadow-card transition-colors duration-150 hover:shadow-dropdown ${!alert.is_read ? 'border-l-4 border-l-primary' : 'opacity-70'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${alert.type === 'overdue' ? 'text-destructive' : 'text-chart-3'}`}>
                    {alert.type === 'overdue' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={alert.type === 'overdue' ? 'destructive' : 'warning'}>
                        {alert.type === 'overdue' ? 'Em Atraso' : 'Vencendo'}
                      </Badge>
                      {!alert.is_read && <Badge variant="default" className="text-[10px]">Novo</Badge>}
                    </div>
                    <p className="text-sm mt-1.5">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                      {alert.installments?.loan_id && (
                        <Link to={`/loans/${alert.installments.loan_id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                          Ver empréstimo <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!alert.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(alert.id)} className="shrink-0 text-xs">
                      Marcar lido
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
