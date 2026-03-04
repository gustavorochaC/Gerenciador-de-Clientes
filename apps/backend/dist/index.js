"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./modules/auth/routes");
const routes_2 = require("./modules/clients/routes");
const routes_3 = require("./modules/loans/routes");
const routes_4 = require("./modules/installments/routes");
const routes_5 = require("./modules/dashboard/routes");
const routes_6 = require("./modules/alerts/routes");
const routes_7 = require("./modules/reports/routes");
const routes_8 = require("./modules/transactions/routes");
const alertCron_1 = require("./jobs/alertCron");
dotenv_1.default.config({ path: '../../.env' });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', routes_1.authRouter);
app.use('/api/clients', routes_2.clientsRouter);
app.use('/api/loans', routes_3.loansRouter);
app.use('/api/installments', routes_4.installmentsRouter);
app.use('/api/dashboard', routes_5.dashboardRouter);
app.use('/api/alerts', routes_6.alertsRouter);
app.use('/api/reports', routes_7.reportsRouter);
app.use('/api/transactions', routes_8.transactionsRouter);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Start cron job
(0, alertCron_1.startAlertCron)();
app.listen(PORT, () => {
    console.log(`🚀 LoanTrack API running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map