import { Router } from 'express';
import {
  createMyPromotion,
  createMyService,
  deleteMyPromotion,
  getMyBusiness,
  updateMyService,
  withdrawMyServiceChanges,
} from '../controllers/providerController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(requireAuth, requireRole(['prestador']));

router.get('/mi-negocio', getMyBusiness);
// Todo lo que envía el prestador queda pendiente de revisión (ver providerController).
router.post('/servicios', createMyService);
router.patch('/servicios/:id', updateMyService);
router.delete('/servicios/:id/cambios', withdrawMyServiceChanges);
router.post('/promociones', createMyPromotion);
router.delete('/promociones/:id', deleteMyPromotion);

export default router;
