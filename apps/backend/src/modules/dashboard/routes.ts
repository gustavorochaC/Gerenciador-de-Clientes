import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getSummary, getChartData } from './controller';

const router = Router();
router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/chart', getChartData);

export { router as dashboardRouter };
