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

// Raiz: página HTML para quem abre a URL no navegador (não JSON)
const frontendUrl = process.env.FRONTEND_URL || '';
app.get('/', (_req, res) => {
  res.type('text/html').send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gerenciador de Clientes - API</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✓</text></svg>">
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #e2e8f0; }
    .card { text-align: center; padding: 2rem; max-width: 420px; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #fff; }
    p { color: #94a3b8; margin: 1rem 0; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .badge { display: inline-block; background: #22c55e; color: #fff; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; margin-bottom: 1rem; }
    .links { margin-top: 1.5rem; }
    .links a { display: inline-block; margin: 0 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Online</span>
    <h1>Gerenciador de Clientes</h1>
    <p>API em funcionamento.</p>
    <div class="links">
      <a href="/api/health">Ver status da API</a>
      ${frontendUrl ? ` · <a href="${frontendUrl}">Abrir aplicação</a>` : ''}
    </div>
  </div>
</body>
</html>
  `);
});

// Evita 404 no console quando o navegador pede favicon.ico
app.get('/favicon.ico', (_req, res) => res.status(204).end());

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
