import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import authRoutes from './routes/authRoutes';
import plotRoutes from './routes/plotRoutes';
import observationRoutes from './routes/observationRoutes';
import interventionRoutes from './routes/interventionRoutes';
import expertRoutes from './routes/expertRoutes';
import reportRoutes from './routes/reportRoutes';
import { errorHandler } from './middleware/errorHandler';
import { aiClient } from './services/aiClient';
import { isMongoConnected } from './models/store';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for observation photographs
app.use('/uploads', express.static(config.uploadDir));

// System Health Check
app.get('/api/health', async (_req, res) => {
  const aiHealth = await aiClient.checkHealth();
  res.json({
    status: 'healthy',
    service: 'CropCare AI Application Backend',
    database: isMongoConnected() ? 'mongodb_connected' : 'in_memory_persistence_active',
    aiService: aiHealth,
    timestamp: new Date().toISOString(),
  });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plots', plotRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/reports', reportRoutes);

// Catch-all 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Global Error Handler
app.use(errorHandler);
