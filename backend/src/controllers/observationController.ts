import { Response } from 'express';
import path from 'path';
import { AuthenticatedRequest } from '../middleware/auth';
import { store } from '../models/store';
import { weatherService } from '../services/weatherService';
import { aiClient } from '../services/aiClient';
import { progressionEngine } from '../services/progressionEngine';

export const uploadObservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No image file uploaded. Please upload a clear photo of the crop leaf.',
        code: 'MISSING_FILE',
      });
      return;
    }

    const { plotId, symptomsReported, notes } = req.body;
    if (!plotId) {
      res.status(400).json({ success: false, error: 'plotId is required' });
      return;
    }

    const plot = await store.plots.findById(plotId);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }

    if (user.role === 'farmer' && plot.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Capture weather conditions at the time of observation
    const weather = await weatherService.getWeather(
      plot.location.lat,
      plot.location.lng,
      plot.location.region
    );

    const relativeUrl = `/uploads/${file.filename}`;

    const observation = await store.observations.create({
      plotId,
      ownerId: user._id,
      imageUrl: relativeUrl,
      originalFileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      timestamp: new Date().toISOString(),
      symptomsReported,
      notes,
      weatherSnapshot: weather,
    });

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'OBSERVATION_UPLOADED',
      resourceType: 'Observation',
      resourceId: observation._id,
      outcome: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'Observation photograph uploaded and recorded successfully',
      observation,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const analyzeObservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const observation = await store.observations.findById(id);
    if (!observation) {
      res.status(404).json({ success: false, error: 'Observation not found' });
      return;
    }

    const plot = await store.plots.findById(observation.plotId);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Associated plot not found' });
      return;
    }

    if (user.role === 'farmer' && observation.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Resolve absolute path to image file
    const absoluteFilePath = path.resolve(
      __dirname,
      '../../',
      observation.imageUrl.startsWith('/') ? observation.imageUrl.slice(1) : observation.imageUrl
    );

    // Call Python AI service for inference, quality validation, and uncertainty evaluation
    const aiResult = await aiClient.analyzeImage(absoluteFilePath, plot.cropType);

    // Persist prediction
    const prediction = await store.predictions.create({
      observationId: observation._id,
      plotId: plot._id,
      modelVersion: aiResult.modelVersion,
      topClass: aiResult.topClass,
      topDisplayName: aiResult.topDisplayName,
      confidence: aiResult.confidence,
      entropy: aiResult.entropy,
      accepted: aiResult.accepted,
      reviewReason: aiResult.reviewReason,
      classProbabilities: aiResult.classProbabilities,
      limitationsNotice: aiResult.limitationsNotice,
      generatedAt: new Date().toISOString(),
    });

    // Update observation reference
    await store.observations.update(observation._id, {
      predictionId: prediction._id,
      imageQuality: aiResult.imageQuality,
    });

    // Perform longitudinal symptom progression against previous observation of this plot
    const allPlotObs = await store.observations.findByPlot(plot._id);
    // Find prior observation (chronologically before current)
    const priorObservations = allPlotObs
      .filter((o) => o._id !== observation._id && new Date(o.timestamp) <= new Date(observation.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let progressRecord = null;
    if (priorObservations.length > 0) {
      const prev = priorObservations[0];
      progressRecord = await progressionEngine.evaluatePlotProgression(plot._id, observation, prev);
      await store.progressRecords.create(progressRecord);
    } else {
      progressRecord = await progressionEngine.evaluatePlotProgression(plot._id, observation);
      await store.progressRecords.create(progressRecord);
    }

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'AI_ANALYSIS_PERFORMED',
      resourceType: 'Prediction',
      resourceId: prediction._id,
      details: {
        topClass: prediction.topClass,
        confidence: prediction.confidence,
        accepted: prediction.accepted,
      },
      outcome: 'success',
    });

    res.json({
      success: true,
      prediction,
      progressRecord,
      observation: {
        ...observation,
        predictionId: prediction._id,
        imageQuality: aiResult.imageQuality,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getObservationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const observation = await store.observations.findById(id);
    if (!observation) {
      res.status(404).json({ success: false, error: 'Observation not found' });
      return;
    }

    if (user.role === 'farmer' && observation.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const prediction = await store.predictions.findByObservation(id);
    const review = await store.expertReviews.findByObservation(id);

    res.json({
      success: true,
      observation: {
        ...observation,
        prediction: prediction || null,
        expertReview: review || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const requestExpertReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const observation = await store.observations.findById(id);
    if (!observation) {
      res.status(404).json({ success: false, error: 'Observation not found' });
      return;
    }

    if (user.role === 'farmer' && observation.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const existingReview = await store.expertReviews.findByObservation(id);
    if (existingReview) {
      res.json({
        success: true,
        message: 'Review already requested for this observation',
        review: existingReview,
      });
      return;
    }

    const review = await store.expertReviews.create({
      observationId: id,
      plotId: observation.plotId,
      farmerId: user._id,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });

    await store.observations.update(id, { expertReviewRequested: true });

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'EXPERT_REVIEW_REQUESTED',
      resourceType: 'ExpertReview',
      resourceId: review._id,
      outcome: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'Observation successfully submitted to the Agricultural Expert Review queue.',
      review,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
