import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  uploadDocument,
  deleteDocument,
} from './controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.post('/:id/documents', uploadDocument);
router.delete('/:id/documents/:docId', deleteDocument);

export { router as clientsRouter };
