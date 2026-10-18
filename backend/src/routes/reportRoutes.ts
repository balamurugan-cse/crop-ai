import { Router } from 'express';
import { getPlotReport, getResearchMetrics } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/plots/:id', getPlotReport);
router.get('/research', getResearchMetrics);

export default router;
