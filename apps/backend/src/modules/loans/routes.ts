import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getLoans, getLoan, createLoan, updateLoan, updateLoanStatus, deleteLoan } from './controller';

const router = Router();
router.use(authMiddleware);

router.get('/', getLoans);
router.get('/:id', getLoan);
router.post('/', createLoan);
router.put('/:id', updateLoan);
router.patch('/:id/status', updateLoanStatus);
router.delete('/:id', deleteLoan);

export { router as loansRouter };
