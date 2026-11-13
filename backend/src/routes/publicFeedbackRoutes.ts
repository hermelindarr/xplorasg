import { Router } from 'express';
import { trackUsage } from '../controllers/analyticsController';
import { submitSurvey } from '../controllers/surveyController';
import { optionalAuth } from '../middlewares/optionalAuth';
import { rateLimit } from '../middlewares/rateLimit';

const router = Router();

router.post(
  '/encuesta',
  // 30 por hora por IP: alcanza para un salón que responde desde el mismo wifi y frena los envíos masivos.
  rateLimit({ windowMs: 60 * 60_000, max: 30, message: 'Ya registramos muchas respuestas desde esta red. Inténtalo más tarde. ¡Gracias!' }),
  optionalAuth,
  submitSurvey,
);
router.post(
  '/analitica',
  rateLimit({ windowMs: 60_000, max: 90, message: 'Demasiados eventos.' }),
  trackUsage,
);

export default router;
