import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getTransactions } from './controller';

const router = Router();
router.use(authMiddleware);
router.get('/', getTransactions);

export { router as transactionsRouter };
