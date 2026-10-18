import { Router } from 'express';
import {
  createPlot,
  getPlots,
  getPlotById,
  updatePlot,
  getPlotHistory,
  getPlotProgression,
  getPlotRisk,
  createPlotSchema,
  updatePlotSchema,
} from '../controllers/plotController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createPlotSchema), createPlot);
router.get('/', getPlots);
router.get('/:id', getPlotById);
router.put('/:id', validateBody(updatePlotSchema), updatePlot);
router.get('/:id/history', getPlotHistory);
router.get('/:id/progression', getPlotProgression);
router.get('/:id/risk', getPlotRisk);

export default router;
