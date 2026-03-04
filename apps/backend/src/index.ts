import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { authRouter } from './modules/auth/routes';
import { clientsRouter } from './modules/clients/routes';
import { loansRouter } from './modules/loans/routes';
import { installmentsRouter } from './modules/installments/routes';
import { dashboardRouter } from './modules/dashboard/routes';
import { alertsRouter } from './modules/alerts/routes';
import { reportsRouter } from './modules/reports/routes';
import { transactionsRouter } from './modules/transactions/routes';
import { startAlertCron, runAlertJob } from './jobs/alertCron';

// Carrega .env na raiz do projeto (dev); em produção as variáveis vêm do ambiente (Coolify, etc.)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Raiz: evita 404 ao acessar a URL do backend (ex.: na Vercel)
app.get('/', (_req, res) => {
  res.json({
    service: 'Gerenciador de Clientes API',
    status: 'ok',
    health: '/api/health',
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/loans', loansRouter);
app.use('/api/installments', installmentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/transactions', transactionsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint para Vercel Cron: executa o job de alertas (protegido por CRON_SECRET)
// GET/POST: Vercel Cron envia GET com Authorization: Bearer <CRON_SECRET>
const cronHandler = async (req: express.Request, res: express.Response) => {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers['authorization']?.replace('Bearer ', '') ?? req.query.secret;
  if (!secret || provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    await runAlertJob();
    res.json({ ok: true, message: 'Alert job completed' });
  } catch (err) {
    console.error('Cron run-alerts error:', err);
    res.status(500).json({ error: 'Job failed' });
  }
};
app.get('/api/cron/run-alerts', cronHandler);
app.post('/api/cron/run-alerts', cronHandler);

// Na Vercel não usamos listen nem node-cron (cron é via Vercel Cron → POST /api/cron/run-alerts)
if (!process.env.VERCEL) {
  startAlertCron();
  app.listen(PORT, () => {
    console.log(`🚀 Rocha Fashion API running on port ${PORT}`);
  });
}

export default app;
