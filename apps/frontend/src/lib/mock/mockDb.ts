export const initialMockData = {
  users: [
    {
      id: "usr_123",
      email: "admin@loantrack.com",
      name: "Administrador",
      password: "admin", // just for mock login
    }
  ],
  clients: [
    {
      id: "cli_1",
      name: "João Silva",
      cpf: "111.111.111-11",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      address: "Rua das Flores, 123",
      status: "active",
      created_at: new Date().toISOString()
    },
    {
      id: "cli_2",
      name: "Maria Oliveira",
      cpf: "222.222.222-22",
      email: "maria@email.com",
      phone: "(11) 88888-8888",
      address: "Av Paulista, 1000",
      status: "active",
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  loans: [
    {
      id: "loan_1",
      client_id: "cli_1",
      user_id: "usr_123",
      principal_amount: 5000,
      interest_rate: 3.5,
      total_installments: 5,
      installment_amount: 1175,
      start_date: new Date().toISOString(),
      due_day: 10,
      status: "active",
      total_amount: 5875,
      notes: null,
      created_at: new Date().toISOString()
    }
  ],
  installments: [
    {
      id: "inst_1",
      loan_id: "loan_1",
      installment_no: 1,
      amount: 1175,
      due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: "pending",
      paid_amount: 0,
      paid_at: null
    },
    {
      id: "inst_2",
      loan_id: "loan_1",
      installment_no: 2,
      amount: 1175,
      due_date: new Date(Date.now() + 40 * 86400000).toISOString(),
      status: "pending",
      paid_amount: 0,
      paid_at: null
    },
    {
      id: "inst_3",
      loan_id: "loan_1",
      installment_no: 3,
      amount: 1175,
      due_date: new Date(Date.now() + 70 * 86400000).toISOString(),
      status: "pending",
      paid_amount: 0,
      paid_at: null
    },
    {
      id: "inst_4",
      loan_id: "loan_1",
      installment_no: 4,
      amount: 1175,
      due_date: new Date(Date.now() + 100 * 86400000).toISOString(),
      status: "pending",
      paid_amount: 0,
      paid_at: null
    },
    {
      id: "inst_5",
      loan_id: "loan_1",
      installment_no: 5,
      amount: 1175,
      due_date: new Date(Date.now() + 130 * 86400000).toISOString(),
      status: "pending",
      paid_amount: 0,
      paid_at: null
    }
  ],
  transactions: [
    {
      id: "txn_1",
      loan_id: "loan_1",
      client_id: "cli_1",
      amount: 5000,
      type: "loan_created",
      transaction_date: new Date().toISOString(),
      description: "Empréstimo criado: 5x de R$ 1175.00"
    }
  ],
  alerts: [
    {
      id: "alert_1",
      type: "payment_due",
      message: "Parcela 1 do João Silva vence em 10 dias.",
      is_read: false,
      created_at: new Date().toISOString()
    }
  ]
};

class MockDatabase {
  private data!: typeof initialMockData;

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem('loantrack_mock_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.loans && parsed.loans[0] && parsed.loans[0].amount !== undefined) {
           // Clear invalid old format state
           this.data = JSON.parse(JSON.stringify(initialMockData));
           this.save();
        } else {
           this.data = parsed;
        }
      } catch (e) {
        this.data = JSON.parse(JSON.stringify(initialMockData));
        this.save();
      }
    } else {
      this.data = JSON.parse(JSON.stringify(initialMockData));
      this.save();
    }
  }

  private save() {
    localStorage.setItem('loantrack_mock_db', JSON.stringify(this.data));
  }

  public reset() {
    this.data = JSON.parse(JSON.stringify(initialMockData));
    this.save();
  }

  // --- Users ---
  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email === email);
  }

  // --- Clients ---
  public getClients() {
    return this.data.clients.map(c => {
      const activeLoansCount = this.data.loans.filter(l => l.client_id === c.id && l.status === 'active').length;
      return { ...c, active_loans_count: activeLoansCount };
    });
  }

  public getClient(id: string) {
    const client = this.data.clients.find(c => c.id === id);
    if (!client) return null;
    
    // Attach loans with installments
    const clientLoans = this.data.loans.filter(l => l.client_id === id).map(l => {
      const loanInstalls = this.data.installments.filter(i => i.loan_id === l.id);
      return { ...l, installments: loanInstalls };
    });
    
    return { ...client, loans: clientLoans, client_documents: [] };
  }

  public addClient(client: any) {
    const newClient = { ...client, id: `cli_${Date.now()}`, status: 'active', created_at: new Date().toISOString() };
    this.data.clients.push(newClient);
    this.save();
    return newClient;
  }

  public updateClient(id: string, updates: any) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clients[idx] = { ...this.data.clients[idx], ...updates };
      this.save();
      return this.data.clients[idx];
    }
    return null;
  }

  public deleteClient(id: string) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clients[idx].status = 'inactive';
      this.save();
    }
  }

  // --- Loans ---
  public getLoans() {
    return this.data.loans.map(loan => {
      const client = this.data.clients.find(c => c.id === loan.client_id);
      const loanInstalls = this.data.installments.filter(i => i.loan_id === loan.id);
      const paidCount = loanInstalls.filter(i => i.status === 'paid').length;
      
      return {
        ...loan,
        client_name: client?.name,
        client_cpf: client?.cpf,
        paid_installments: paidCount,
        total_installment_count: loanInstalls.length,
      };
    });
  }

  public getLoan(id: string) {
    const loan = this.data.loans.find(l => l.id === id);
    if (loan) {
      const client = this.data.clients.find(c => c.id === loan.client_id);
      const loanInstalls = this.data.installments.filter(i => i.loan_id === id).sort((a,b) => a.installment_no - b.installment_no);
      return { 
        ...loan, 
        clients: client ? { name: client.name, cpf: client.cpf, phone: client.phone } : null,
        installments: loanInstalls 
      };
    }
    return null;
  }

  public addLoan(loan: any) {
    const principal = Number(loan.principal_amount);
    const rate = Number(loan.interest_rate);
    const count = Number(loan.total_installments);
    
    const totalInterest = principal * (rate / 100) * count;
    const totalAmount = principal + totalInterest;
    const installmentAmount = totalAmount / count;
    
    const newLoan = { 
      ...loan, 
      id: `loan_${Date.now()}`, 
      installment_amount: installmentAmount,
      total_amount: totalAmount,
      status: 'active',
      created_at: new Date().toISOString() 
    };
    
    this.data.loans.push(newLoan);
    
    // Generate installments
    const installments = [];
    let currentDate = new Date(newLoan.start_date);
    
    for (let i = 1; i <= count; i++) {
        currentDate = new Date(currentDate.getTime() + 30 * 86400000); // add 30 days approx
        installments.push({
            id: `inst_${Date.now()}_${i}`,
            loan_id: newLoan.id,
            installment_no: i,
            amount: installmentAmount,
            due_date: currentDate.toISOString(),
            status: "pending",
            paid_amount: 0,
            paid_at: null
        });
    }
    this.data.installments.push(...installments);
    
    // Generate transaction
    this.data.transactions.push({
        id: `txn_${Date.now()}`,
        loan_id: newLoan.id,
        client_id: newLoan.client_id,
        amount: totalAmount,
        type: "loan_created",
        transaction_date: new Date().toISOString(),
        description: `Empréstimo criado: ${count}x de R$ ${installmentAmount.toFixed(2)}`
    });

    this.save();
    return this.getLoan(newLoan.id);
  }

  public updateLoan(id: string, updates: any) {
    const idx = this.data.loans.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.loans[idx] = { ...this.data.loans[idx], ...updates };
      this.save();
      return this.data.loans[idx];
    }
    return null;
  }
  public deleteLoan(id: string) {
    this.data.loans = this.data.loans.filter(l => l.id !== id);
    this.data.installments = this.data.installments.filter(i => i.loan_id !== id);
    this.data.transactions = this.data.transactions.filter(t => t.loan_id !== id);
    this.save();
  }

  // --- Installments ---
  public getInstallments(loanId: string) {
    return this.data.installments.filter(i => i.loan_id === loanId);
  }
  public updateInstallment(id: string, updates: any) {
    const idx = this.data.installments.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.data.installments[idx] = { ...this.data.installments[idx], ...updates };
      this.save();
      return this.data.installments[idx];
    }
    return null;
  }

  // --- Dashboard ---
  public getDashboardSummary() {
    const totalLoans = this.data.loans.reduce((acc, curr) => acc + curr.total_amount, 0);
    const activeClients = this.data.clients.length;
    const pendingInstallments = this.data.installments.filter(i => i.status === 'pending').length;
    
    return {
      total_loans: totalLoans,
      active_loans_count: this.data.loans.filter(l => l.status === 'active').length,
      active_clients: activeClients,
      default_rate: 0,
      total_received_month: this.data.installments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0),
      pending_installments: pendingInstallments
    };
  }

  // --- Alerts ---
  public getAlerts(unreadOnly = false) {
    if (unreadOnly) {
      return this.data.alerts.filter(a => !a.is_read);
    }
    return this.data.alerts;
  }
  public markAlertAsRead(id: string) {
    const idx = this.data.alerts.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.alerts[idx].is_read = true;
      this.save();
    }
  }
  public markAllAlertsAsRead() {
    this.data.alerts.forEach(a => a.is_read = true);
    this.save();
  }

  // --- Transactions ---
  public getTransactions() {
    const loansMap = new Map();
    this.data.loans.forEach(l => {
      loansMap.set(l.id, { ...l, client: this.getClient(l.client_id) });
    });

    return this.data.transactions.map(t => ({
      ...t,
      loan: loansMap.get(t.loan_id)
    }));
  }
}

export const mockDb = new MockDatabase();
