import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './modules/auth/routes';
import { clientsRouter } from './modules/clients/routes';
import { loansRouter } from './modules/loans/routes';
import { installmentsRouter } from './modules/installments/routes';
import { dashboardRouter } from './modules/dashboard/routes';
import { alertsRouter } from './modules/alerts/routes';
import { reportsRouter } from './modules/reports/routes';
import { transactionsRouter } from './modules/transactions/routes';
import { startAlertCron } from './jobs/alertCron';

dotenv.config({ path: '../../.env' });

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

// Start cron job
startAlertCron();

app.listen(PORT, () => {
  console.log(`🚀 Rocha Fashion API running on port ${PORT}`);
});

export default app;
