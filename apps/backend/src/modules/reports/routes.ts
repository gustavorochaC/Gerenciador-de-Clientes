import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getClientReport, getGeneralReport } from './controller';

const router = Router();
router.use(authMiddleware);

router.get('/pdf/client/:id', getClientReport);
router.get('/pdf/general', getGeneralReport);

export { router as reportsRouter };
