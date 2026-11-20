import { Router } from 'express';
import { calculateRoute, currentWeather, elevations } from '../controllers/travelController';

const router = Router();

router.get('/clima', currentWeather);
router.get('/altitudes', elevations);
router.post('/ruta', calculateRoute);

export default router;

