import { Router } from 'express';
import {
  uploadObservation,
  analyzeObservation,
  getObservationById,
  requestExpertReview,
} from '../controllers/observationController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('image'), uploadObservation);
router.get('/:id', getObservationById);
router.post('/:id/analyze', analyzeObservation);
router.post('/:id/review', requestExpertReview);

export default router;
