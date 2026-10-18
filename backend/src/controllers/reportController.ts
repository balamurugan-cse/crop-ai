import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { store } from '../models/store';
import { weatherService } from '../services/weatherService';
import { riskEngine } from '../services/riskEngine';
import { config } from '../config/env';

export const getPlotReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const plot = await store.plots.findById(id);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }

    if (user.role === 'farmer' && plot.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const observations = await store.observations.findByPlot(id);
    const interventions = await store.interventions.findByPlot(id);
    const progressRecords = await store.progressRecords.findByPlot(id);

    // Weather & Risk
    const weather = await weatherService.getWeather(
      plot.location.lat,
      plot.location.lng,
      plot.location.region
    );
    const riskAssessment = riskEngine.evaluateRisk(plot._id, plot.cropType, weather);

    // Compute aggregated costs
    const totalInterventionCost = interventions.reduce(
      (sum, item) => sum + (item.reportedCost || 0),
      0
    );

    // Collate observations with their predictions
    const fullObservations = await Promise.all(
      observations.map(async (obs) => {
        const pred = await store.predictions.findByObservation(obs._id);
        const review = await store.expertReviews.findByObservation(obs._id);
        return {
          ...obs,
          prediction: pred || null,
          expertReview: review || null,
        };
      })
    );

    const report = {
      generatedAt: new Date().toISOString(),
      disclaimer:
        'CropCare AI Decision Support System: This report synthesizes automated optical observations, epidemiological microclimate risk heuristics, and farmer-reported interventions. It is intended for advisory guidance and does not replace certified phytosanitary diagnostic inspection.',
      plotSummary: {
        id: plot._id,
        name: plot.name,
        cropType: plot.cropType,
        variety: plot.variety || 'Standard',
        plantingDate: plot.plantingDate,
        location: plot.location,
        plotSizeAcres: plot.plotSizeAcres,
        status: plot.status,
      },
      currentRiskStatus: {
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        primaryThreats: riskAssessment.primaryThreats,
        riskFactors: riskAssessment.riskFactors,
        rulesApplied: riskAssessment.rulesApplied,
        agronomicRecommendations: riskAssessment.agronomicRecommendations,
        weatherConditions: weather,
      },
      progressionSummary: {
        totalObservations: observations.length,
        latestTrend: progressRecords.length > 0 ? progressRecords[0].symptomTrend : 'no_data',
        recentLesionCoveragePercent:
          progressRecords.length > 0 ? progressRecords[0].lesionCoveragePercentCurrent : null,
        records: progressRecords,
      },
      economicSummary: {
        totalInterventionsLogged: interventions.length,
        totalCostReported: totalInterventionCost,
        interventions,
      },
      observationTimeline: fullObservations,
    };

    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getResearchMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Attempt to query the Python AI service evaluation endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    let aiMetrics = null;
    try {
      const resp = await fetch(`${config.aiServiceUrl}/metrics`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        aiMetrics = await resp.json();
      }
    } catch {
      clearTimeout(timeout);
    }

    if (aiMetrics) {
      res.json({ success: true, ...aiMetrics });
      return;
    }

    // Reference protocol and documented benchmark figures from the project blueprint
    res.json({
      success: true,
      source: 'blueprint_research_protocol',
      status: 'model_training_ready',
      note: 'Live model evaluation metrics will be updated when python evaluate.py completes.',
      taxonomy: [
        'tomato_early_blight',
        'tomato_late_blight',
        'tomato_healthy',
        'potato_early_blight',
        'potato_late_blight',
        'potato_healthy',
        'corn_common_rust',
        'corn_northern_leaf_blight',
        'corn_healthy',
        'bell_pepper_bacterial_spot',
        'bell_pepper_healthy',
      ],
      hypotheses: [
        {
          id: 'H1',
          statement: 'Field-image evaluation (PlantDoc) will reveal a significant performance gap compared to controlled laboratory images (PlantVillage).',
          status: 'Formulated for empirical verification',
        },
        {
          id: 'H2',
          statement: 'Confidence-aware rejection (thresholding at p > 0.65 and entropy < 1.20) will reduce the error rate among accepted predictions while safely referring uncertain cases to human experts.',
          status: 'Formulated for empirical verification',
        },
        {
          id: 'H3',
          statement: 'Standardized repeated observations linked to the same plot will produce more reliable symptom-progression estimates than arbitrary image comparisons.',
          status: 'Supported by longitudinal optical delta tracking',
        },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
