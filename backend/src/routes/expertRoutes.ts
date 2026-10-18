import { Router } from 'express';
import {
  getExpertQueue,
  submitExpertReview,
  getReviewByObservation,
  submitReviewSchema,
} from '../controllers/expertController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Only agricultural experts and administrators can access the review queue or submit reviews
router.get('/queue', requireRole(['expert', 'admin']), getExpertQueue);
router.post('/reviews', requireRole(['expert', 'admin']), validateBody(submitReviewSchema), submitExpertReview);
router.get('/reviews/:observationId', getReviewByObservation);

export default router;
