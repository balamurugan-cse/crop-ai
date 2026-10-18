import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { store } from '../models/store';

export const createInterventionSchema = z.object({
  plotId: z.string().min(1, 'plotId is required'),
  date: z.string().min(4, 'date is required'),
  interventionType: z.enum(['fungicide', 'fertilizer', 'irrigation', 'pruning', 'pesticide', 'other']),
  productUsed: z.string().optional(),
  reportedCost: z.number().nonnegative().optional(),
  dosage: z.string().optional(),
  notes: z.string().optional(),
});

export const createIntervention = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const body = req.body;

    const plot = await store.plots.findById(body.plotId);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }

    if (user.role === 'farmer' && plot.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const intervention = await store.interventions.create({
      plotId: body.plotId,
      ownerId: user._id,
      date: body.date,
      interventionType: body.interventionType,
      productUsed: body.productUsed,
      reportedCost: body.reportedCost,
      dosage: body.dosage,
      notes: body.notes,
    });

    await store.auditLogs.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'INTERVENTION_LOGGED',
      resourceType: 'Intervention',
      resourceId: intervention._id,
      outcome: 'success',
    });

    res.status(201).json({ success: true, intervention });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getInterventionsByPlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { plotId } = req.params;
    const user = req.user!;

    const plot = await store.plots.findById(plotId);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }

    if (user.role === 'farmer' && plot.ownerId !== user._id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const interventions = await store.interventions.findByPlot(plotId);
    res.json({ success: true, count: interventions.length, interventions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
