import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { store } from '../models/store';

export const submitReviewSchema = z.object({
  reviewId: z.string().min(1, 'reviewId is required'),
  verifiedDiagnosis: z.string().min(2, 'Verified diagnosis is required'),
  severityRating: z.number().int().min(1).max(5),
  clinicalAssessment: z.string().min(5, 'Clinical assessment must be at least 5 characters'),
  recommendedIntervention: z.string().min(5, 'Recommended intervention is required'),
});

export const getExpertQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reviews = await store.expertReviews.findPending();

    // Populate observation and plot details for each pending review
    const populated = await Promise.all(
      reviews.map(async (rev) => {
        const observation = await store.observations.findById(rev.observationId);
        const plot = observation ? await store.plots.findById(observation.plotId) : null;
        const prediction = observation ? await store.predictions.findByObservation(observation._id) : null;
        const farmer = await store.users.findById(rev.farmerId);

        return {
          ...rev,
          observation,
          plot,
          prediction,
          farmerName: farmer ? farmer.name : 'Unknown Farmer',
        };
      })
    );

    res.json({ success: true, count: populated.length, queue: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const submitExpertReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const body = req.body;

    const existingReview = await store.expertReviews.findById(body.reviewId);
    if (!existingReview) {
      res.status(404).json({ success: false, error: 'Review request not found' });
      return;
    }

    const updated = await store.expertReviews.update(body.reviewId, {
      expertId: user._id,
      expertName: user.name,
      status: 'completed',
      verifiedDiagnosis: body.verifiedDiagnosis,
      severityRating: body.severityRating,
      clinicalAssessment: body.clinicalAssessment,
      recommendedIntervention: body.recommendedIntervention,
      reviewedAt: new Date().toISOString(),
    });

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'EXPERT_REVIEW_COMPLETED',
      resourceType: 'ExpertReview',
      resourceId: body.reviewId,
      details: {
        verifiedDiagnosis: body.verifiedDiagnosis,
        severityRating: body.severityRating,
      },
      outcome: 'success',
    });

    res.json({
      success: true,
      message: 'Expert review submitted successfully',
      review: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getReviewByObservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { observationId } = req.params;
    const review = await store.expertReviews.findByObservation(observationId);
    res.json({ success: true, review });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
