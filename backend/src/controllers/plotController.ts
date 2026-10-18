import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { store } from '../models/store';
import { CropType } from '../models/types';
import { weatherService } from '../services/weatherService';
import { riskEngine } from '../services/riskEngine';

export const createPlotSchema = z.object({
  name: z.string().min(2, 'Plot name must be at least 2 characters'),
  cropType: z.enum(['Tomato', 'Potato', 'Corn', 'Grape', 'Bell Pepper']),
  variety: z.string().optional(),
  plantingDate: z.string().min(4, 'Valid planting date is required'),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    region: z.string().min(2, 'Region name is required'),
  }),
  plotSizeAcres: z.number().positive().optional(),
  observationSchedule: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePlotSchema = z.object({
  name: z.string().min(2).optional(),
  cropType: z.enum(['Tomato', 'Potato', 'Corn', 'Grape', 'Bell Pepper']).optional(),
  variety: z.string().optional(),
  plantingDate: z.string().optional(),
  location: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      region: z.string().optional(),
    })
    .optional(),
  plotSizeAcres: z.number().positive().optional(),
  observationSchedule: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
  notes: z.string().optional(),
});

export const createPlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const body = req.body;

    const plot = await store.plots.create({
      ownerId: user._id,
      name: body.name,
      cropType: body.cropType as CropType,
      variety: body.variety,
      plantingDate: body.plantingDate,
      location: body.location,
      plotSizeAcres: body.plotSizeAcres,
      observationSchedule: body.observationSchedule || 'Weekly scouting',
      status: 'active',
      notes: body.notes,
    });

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'PLOT_CREATED',
      resourceType: 'Plot',
      resourceId: plot._id,
      outcome: 'success',
    });

    res.status(201).json({ success: true, plot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPlots = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let plots = [];

    if (user.role === 'admin' || user.role === 'expert') {
      plots = await store.plots.findAll();
    } else {
      plots = await store.plots.findByOwner(user._id);
    }

    res.json({ success: true, count: plots.length, plots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPlotById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const plot = await store.plots.findById(id);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found', code: 'NOT_FOUND' });
      return;
    }

    // Ownership security check: Farmers can only access their own plots
    if (user.role === 'farmer' && plot.ownerId !== user._id) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to access another farmer\'s plot',
        code: 'FORBIDDEN',
      });
      return;
    }

    res.json({ success: true, plot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updatePlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existingPlot = await store.plots.findById(id);
    if (!existingPlot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }

    if (user.role === 'farmer' && existingPlot.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const updated = await store.plots.update(id, req.body);
    res.json({ success: true, plot: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPlotHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Attach prediction details to observations
    const observationsWithPredictions = await Promise.all(
      observations.map(async (obs) => {
        const prediction = await store.predictions.findByObservation(obs._id);
        const review = await store.expertReviews.findByObservation(obs._id);
        return {
          ...obs,
          prediction: prediction || null,
          expertReview: review || null,
        };
      })
    );

    res.json({
      success: true,
      plot,
      observations: observationsWithPredictions,
      interventions,
      progressRecords,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPlotProgression = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plot = await store.plots.findById(id);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }

    const progressRecords = await store.progressRecords.findByPlot(id);
    res.json({ success: true, count: progressRecords.length, progressRecords });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPlotRisk = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plot = await store.plots.findById(id);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }

    // Retrieve real weather for plot location
    const weather = await weatherService.getWeather(
      plot.location.lat,
      plot.location.lng,
      plot.location.region
    );

    // Compute verified agronomic risk
    const assessment = riskEngine.evaluateRisk(plot._id, plot.cropType, weather);
    await store.riskAssessments.create(assessment);

    res.json({ success: true, assessment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
