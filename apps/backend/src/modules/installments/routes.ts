import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getInstallments, payInstallment, updateInstallmentStatus } from './controller';

const router = Router();
router.use(authMiddleware);

router.get('/:loanId/installments', getInstallments);
router.patch('/:id/pay', payInstallment);
router.patch('/:id/status', updateInstallmentStatus);

export { router as installmentsRouter };
