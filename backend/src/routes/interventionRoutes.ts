import { Router } from 'express';
import {
  createIntervention,
  getInterventionsByPlot,
  createInterventionSchema,
} from '../controllers/interventionController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createInterventionSchema), createIntervention);
router.get('/plot/:plotId', getInterventionsByPlot);

export default router;
