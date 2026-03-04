import { useState, useEffect } from 'react';
import { reportsApi, clientsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

export default function ReportsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatingGeneral, setGeneratingGeneral] = useState(false);
  const [generatingClient, setGeneratingClient] = useState(false);

  useEffect(() => {
    clientsApi.list({ status: 'active', limit: 100 }).then(res => setClients(res.data.data)).catch(() => {});
  }, []);

  const generatePdfHeader = (doc: jsPDF, title: string) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rocha Fashion', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 20, 28);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 34);
    doc.setDrawColor(200);
    doc.line(20, 38, 190, 38);
    return 45;
  };

  const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Documento confidencial — Rocha Fashion', 105, 295, { align: 'center' });
    }
  };

  const handleGeneralReport = async () => {
    setGeneratingGeneral(true);
    try {
      const res = await reportsApi.generalReport({ start_date: startDate || undefined, end_date: endDate || undefined });
      const data = res.data;
      const doc = new jsPDF();

      let y = generatePdfHeader(doc, 'Relatório Geral');

      // Summary
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Resumo Financeiro', 20, y); y += 8;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Total Emprestado: ${formatCurrency(data.summary.total_loaned)}`, 20, y); y += 6;
      doc.text(`Total Recebido: ${formatCurrency(data.summary.total_received)}`, 20, y); y += 6;
      doc.text(`Total em Aberto: ${formatCurrency(data.summary.total_outstanding)}`, 20, y); y += 6;
      doc.text(`Total em Atraso: ${formatCurrency(data.summary.total_overdue)}`, 20, y); y += 12;

      // Active Loans
      if (data.active_loans?.length > 0) {
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('Empréstimos Ativos', 20, y); y += 8;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');

        const headers = ['Cliente', 'Capital', 'Taxa', 'Parcelas', 'Recebido', 'Saldo'];
        headers.forEach((h, i) => { doc.text(h, 20 + i * 28, y); }); y += 6;
        doc.line(20, y - 2, 190, y - 2);

        data.active_loans.forEach((loan: any) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(String(loan.client_name || '').slice(0, 15), 20, y);
          doc.text(formatCurrency(Number(loan.principal_amount)), 48, y);
          doc.text(`${loan.interest_rate}%`, 76, y);
          doc.text(String(loan.total_installments), 104, y);
          doc.text(formatCurrency(Number(loan.received)), 132, y);
          doc.text(formatCurrency(Number(loan.balance)), 160, y);
          y += 5;
        });
        y += 8;
      }

      // Defaulting
      if (data.defaulting?.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('Clientes Inadimplentes', 20, y); y += 8;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');

        data.defaulting.forEach((d2: any) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`${d2.client_name} — Parcela ${d2.installment_no} — ${d2.days_overdue} dias em atraso — ${formatCurrency(Number(d2.amount))}`, 20, y);
          y += 5;
        });
      }

      addFooter(doc);
      doc.save('relatorio-geral-rocha-fashion.pdf');
      toast.success('Relatório geral gerado com sucesso!');
    } catch { toast.error('Erro ao gerar relatório'); }
    finally { setGeneratingGeneral(false); }
  };

  const handleClientReport = async () => {
    if (!selectedClientId) { toast.error('Selecione um cliente'); return; }
    setGeneratingClient(true);
    try {
      const res = await reportsApi.clientReport(selectedClientId);
      const data = res.data;
      const doc = new jsPDF();

      let y = generatePdfHeader(doc, `Relatório do Cliente: ${data.client.name}`);

      // Client Info
      doc.setFontSize(10);
      doc.text(`Nome: ${data.client.name}`, 20, y); y += 6;
      doc.text(`CPF: ${data.client.cpf}`, 20, y); y += 6;
      doc.text(`Telefone: ${data.client.phone}`, 20, y); y += 6;
      if (data.client.address) { doc.text(`Endereço: ${data.client.address}`, 20, y); y += 6; }
      y += 6;

      // Loans
      (data.loans || []).forEach((loan: any, loanIdx: number) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text(`Empréstimo ${loanIdx + 1} — ${formatCurrency(Number(loan.principal_amount))} (${loan.interest_rate}% a.m.)`, 20, y); y += 7;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');

        const headers = ['Nº', 'Vencimento', 'Valor', 'Status', 'Pago Em', 'Valor Pago'];
        headers.forEach((h, i) => { doc.text(h, 20 + i * 28, y); }); y += 5;
        doc.line(20, y - 2, 190, y - 2);

        (loan.installments || []).forEach((inst: any) => {
          if (y > 275) { doc.addPage(); y = 20; }
          const statusLabels: Record<string, string> = { pending: 'Pendente', paid: 'Pago', overdue: 'Atrasada', partial: 'Parcial' };
          doc.text(String(inst.installment_no), 20, y);
          doc.text(formatDate(inst.due_date), 48, y);
          doc.text(formatCurrency(Number(inst.amount)), 76, y);
          doc.text(statusLabels[inst.status] || inst.status, 104, y);
          doc.text(inst.paid_at ? formatDate(inst.paid_at) : '-', 132, y);
          doc.text(Number(inst.paid_amount) > 0 ? formatCurrency(Number(inst.paid_amount)) : '-', 160, y);
          y += 5;
        });
        y += 8;
      });

      // Summary
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Resumo Consolidado', 20, y); y += 7;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Total Emprestado: ${formatCurrency(data.summary.total_loaned)}`, 20, y); y += 6;
      doc.text(`Total Pago: ${formatCurrency(data.summary.total_paid)}`, 20, y); y += 6;
      doc.text(`Saldo Devedor: ${formatCurrency(data.summary.total_outstanding)}`, 20, y);

      addFooter(doc);
      doc.save(`relatorio-${data.client.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('Relatório do cliente gerado com sucesso!');
    } catch { toast.error('Erro ao gerar relatório'); }
    finally { setGeneratingClient(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-display">Relatórios</h1>
        <p className="text-muted-foreground">Gere relatórios em PDF para análise</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Report */}
        <Card className="shadow-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards] [animation-delay:80ms]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display"><FileText className="w-5 h-5" /> Relatório Geral</CardTitle>
            <CardDescription>Gere um relatório completo com todos os empréstimos, pagamentos e inadimplentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p className="font-medium">O relatório incluirá:</p>
              <ul className="text-muted-foreground text-xs space-y-0.5 list-disc pl-4">
                <li>Resumo financeiro geral</li>
                <li>Tabela de empréstimos ativos</li>
                <li>Pagamentos recebidos no período</li>
                <li>Clientes inadimplentes</li>
              </ul>
            </div>
            <Button className="w-full" onClick={handleGeneralReport} disabled={generatingGeneral}>
              {generatingGeneral ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Gerar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Client Report */}
        <Card className="shadow-card animate-fade-in-up opacity-0 [animation-fill-mode:forwards] [animation-delay:120ms]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display"><FileText className="w-5 h-5" /> Relatório por Cliente</CardTitle>
            <CardDescription>Gere um relatório detalhado de um cliente específico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger><SelectValue placeholder="Escolha um cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p className="font-medium">O relatório incluirá:</p>
              <ul className="text-muted-foreground text-xs space-y-0.5 list-disc pl-4">
                <li>Dados do cliente</li>
                <li>Todos os empréstimos com parcelas</li>
                <li>Resumo consolidado</li>
              </ul>
            </div>
            <Button className="w-full" onClick={handleClientReport} disabled={generatingClient}>
              {generatingClient ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Gerar PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
