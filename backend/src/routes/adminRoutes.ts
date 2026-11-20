import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  getStatistics,
  getSurveyResults,
  getUsageAnalytics,
  listEventsAdmin,
  updateEvent,
  linkProviderAccount,
  listPromotionsForReview,
  listProviders,
  reviewPromotion,
} from '../controllers/adminController';
import {
  approveModeration,
  deleteContentAsAdmin,
  getContentForEdit,
  getReportData,
  listModerationQueue,
  rejectModeration,
  updateContentAsAdmin,
} from '../controllers/moderationController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(requireAuth, requireRole(['administrador']));

router.get('/estadisticas', getStatistics);

// Moderación: bandeja, aprobar y publicar, rechazar, editar directamente y eliminar.
router.get('/moderacion', listModerationQueue);
router.post('/moderacion/:tipo/:id/aprobar', approveModeration);
router.post('/moderacion/:tipo/:id/rechazar', rejectModeration);
router.get('/contenido/:tipo/:id', getContentForEdit);
router.patch('/contenido/:tipo/:id', updateContentAsAdmin);
router.delete('/contenido/:tipo/:id', deleteContentAsAdmin);

// Reportes para exportar (Excel, CSV, Word, impresión).
router.get('/reportes', getReportData);
router.get('/promociones', listPromotionsForReview);
router.patch('/promociones/:id', reviewPromotion);
router.get('/prestadores', listProviders);
router.post('/prestadores/:id/vincular', linkProviderAccount);
router.get('/encuestas', getSurveyResults);
router.get('/analitica', getUsageAnalytics);
router.get('/eventos', listEventsAdmin);
router.post('/eventos', createEvent);
router.patch('/eventos/:id', updateEvent);
router.delete('/eventos/:id', deleteEvent);

export default router;
