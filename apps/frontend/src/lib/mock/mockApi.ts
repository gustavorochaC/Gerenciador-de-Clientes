import { mockDb } from './mockDb';

// Utility to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createResponse = (data: any, status = 200) => {
  return { data, status };
};

export const mockAuthApi = {
  login: async (email: string, password: string) => {
    await delay(800);
    const user = mockDb.getUserByEmail(email);
    // Para fins de teste, em modo mock a senha será ignorada ou verificada de forma simples.
    if (user && password === 'admin') {
      return createResponse({ token: 'mock-jwt-token-123', user });
    }
    throw new Error('Invalid credentials');
  },
  me: async () => {
    await delay(300);
    const user = mockDb.getUserByEmail('admin@loantrack.com');
    if (user) return createResponse(user);
    throw new Error('Unauthorized');
  },
  logout: async () => {
    await delay(200);
    return createResponse({ success: true });
  }
};

export const mockClientsApi = {
  list: async (params?: any) => {
    await delay(500);
    const data = mockDb.getClients();
    return createResponse({ data, pagination: { totalPages: 1 } });
  },
  get: async (id: string) => {
    await delay(300);
    const client = mockDb.getClient(id);
    if (client) return createResponse(client);
    throw new Error('Not found');
  },
  create: async (data: any) => {
    await delay(600);
    return createResponse(mockDb.addClient(data), 201);
  },
  update: async (id: string, data: any) => {
    await delay(600);
    return createResponse(mockDb.updateClient(id, data));
  },
  delete: async (id: string) => {
    await delay(600);
    mockDb.deleteClient(id);
    return createResponse({ success: true });
  },
  uploadDocument: async (id: string, data: any) => {
    await delay(1000);
    return createResponse({ id: 'doc_1', name: 'document.pdf', url: '#' });
  },
  deleteDocument: async (id: string, docId: string) => {
    await delay(500);
    return createResponse({ success: true });
  }
};

export const mockLoansApi = {
  list: async (params?: any) => {
    await delay(500);
    const data = mockDb.getLoans();
    return createResponse({ data, pagination: { totalPages: 1 } });
  },
  get: async (id: string) => {
    await delay(300);
    const loan = mockDb.getLoan(id);
    if (loan) return createResponse(loan);
    throw new Error('Not found');
  },
  create: async (data: any) => {
    await delay(800);
    return createResponse(mockDb.addLoan(data), 201);
  },
  update: async (id: string, data: any) => {
    await delay(600);
    return createResponse(mockDb.updateLoan(id, data));
  },
  updateStatus: async (id: string, status: string) => {
    await delay(500);
    return createResponse(mockDb.updateLoan(id, { status }));
  },
  delete: async (id: string) => {
    await delay(600);
    mockDb.deleteLoan(id);
    return createResponse({ success: true });
  }
};

export const mockInstallmentsApi = {
  list: async (loanId: string) => {
    await delay(400);
    const data = mockDb.getInstallments(loanId);
    return createResponse({ data, pagination: { totalPages: 1 } });
  },
  pay: async (id: string, data: any) => {
    await delay(700);
    return createResponse(mockDb.updateInstallment(id, { ...data, status: 'paid', paid_at: new Date().toISOString() }));
  },
  updateStatus: async (id: string, status: string) => {
    await delay(500);
    return createResponse(mockDb.updateInstallment(id, { status }));
  }
};

export const mockDashboardApi = {
  summary: async () => {
    await delay(600);
    return createResponse(mockDb.getDashboardSummary());
  },
  chart: async () => {
    await delay(600);
    return createResponse([
      { name: 'Jan', expected: 4000, received: 2400 },
      { name: 'Fev', expected: 3000, received: 1398 },
      { name: 'Mar', expected: 2000, received: 9800 },
      { name: 'Abr', expected: 2780, received: 3908 },
      { name: 'Mai', expected: 1890, received: 4800 },
      { name: 'Jun', expected: 2390, received: 3800 },
    ]);
  }
};

export const mockAlertsApi = {
  list: async (unreadOnly?: boolean) => {
    await delay(400);
    const data = mockDb.getAlerts(unreadOnly);
    return createResponse({ data, pagination: { totalPages: 1 } });
  },
  markAsRead: async (id: string) => {
    await delay(300);
    mockDb.markAlertAsRead(id);
    return createResponse({ success: true });
  },
  markAllAsRead: async () => {
    await delay(500);
    mockDb.markAllAlertsAsRead();
    return createResponse({ success: true });
  }
};

export const mockReportsApi = {
  clientReport: async (id: string) => {
    await delay(1500);
    // Simulate raw PDF data or base64
    return createResponse(new Blob(['Fake PDF Content'], { type: 'application/pdf' }));
  },
  generalReport: async (params?: any) => {
    await delay(2000);
    return createResponse(new Blob(['Fake PDF Content'], { type: 'application/pdf' }));
  }
};

export const mockTransactionsApi = {
  list: async (params?: any) => {
    await delay(500);
    const data = mockDb.getTransactions();
    return createResponse({ data, pagination: { totalPages: 1 } });
  }
};
