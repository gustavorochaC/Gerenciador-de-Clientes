import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getAlerts, markAsRead, markAllAsRead } from './controller';

const router = Router();
router.use(authMiddleware);

router.get('/', getAlerts);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export { router as alertsRouter };
