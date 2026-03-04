import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, logout } from './controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

router.post('/login', loginLimiter, login);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

export { router as authRouter };
