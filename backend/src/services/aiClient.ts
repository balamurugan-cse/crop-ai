import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { IClassProbability, IImageQuality } from '../models/types';

export interface AIAnalysisResult {
  isAvailable: boolean;
  modelVersion: string;
  imageQuality: IImageQuality;
  topClass: string;
  topDisplayName: string;
  confidence: number;
  entropy: number;
  accepted: boolean;
  reviewReason?: string;
  classProbabilities: IClassProbability[];
  limitationsNotice: string;
  device?: string;
  error?: string;
}

export interface AIProgressionResult {
  isAvailable: boolean;
  lesionCoveragePercentCurrent: number;
  lesionCoveragePercentPrevious: number;
  lesionDeltaPercent: number;
  vegetativeIndexExGDelta: number;
  lightingInconsistencyFlag: boolean;
  symptomTrend: 'improving' | 'stable' | 'worsening' | 'inconclusive';
  assessmentMethod: string;
  scientificDisclaimer: string;
  error?: string;
}

export class AIClientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.aiServiceUrl;
  }

  async checkHealth(): Promise<{ status: string; checkpointLoaded: boolean; modelVersion?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as any;
        return {
          status: 'online',
          checkpointLoaded: !!data.checkpointLoaded,
          modelVersion: data.modelVersion || '1.0.0',
        };
      }
      return { status: 'degraded', checkpointLoaded: false };
    } catch (e) {
      return { status: 'offline', checkpointLoaded: false };
    }
  }

  async analyzeImage(filePath: string, cropHint?: string): Promise<AIAnalysisResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Image file not found at path: ${filePath}`);
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);
      const formData = new FormData();
      formData.append('file', blob, path.basename(filePath));
      if (cropHint) {
        formData.append('crop_hint', cropHint);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        return {
          isAvailable: false,
          modelVersion: 'unavailable',
          imageQuality: { isAcceptable: false, rejectionReason: errorData.detail || 'AI Service returned error' },
          topClass: 'unknown',
          topDisplayName: 'Analysis Unavailable',
          confidence: 0,
          entropy: 0,
          accepted: false,
          reviewReason: errorData.detail || 'AI Service communication error',
          classProbabilities: [],
          limitationsNotice: 'AI Service encountered an error during inference. Human expert review recommended.',
          error: errorData.detail || `HTTP ${response.status}`,
        };
      }

      const data = (await response.json()) as any;
      return {
        isAvailable: true,
        modelVersion: data.modelVersion || 'mobilenet_v2_v1',
        imageQuality: data.imageQuality || { isAcceptable: true },
        topClass: data.topClass,
        topDisplayName: data.topDisplayName,
        confidence: data.confidence,
        entropy: data.entropy,
        accepted: data.accepted,
        reviewReason: data.reviewReason,
        classProbabilities: data.classProbabilities || [],
        limitationsNotice:
          data.limitationsNotice ||
          'Decision-support prediction only. External field conditions may vary. Verify with agricultural expert before applying chemical treatments.',
        device: data.device,
      };
    } catch (err: any) {
      // AI service is not running or timed out
      return {
        isAvailable: false,
        modelVersion: 'offline',
        imageQuality: { isAcceptable: true, rejectionReason: 'AI service unreachable' },
        topClass: 'pending_service',
        topDisplayName: 'AI Service Unavailable',
        confidence: 0,
        entropy: 0,
        accepted: false,
        reviewReason: 'AI Service is currently offline or starting up. Observation registered for manual review.',
        classProbabilities: [],
        limitationsNotice: 'AI model service is currently offline. Please consult an expert reviewer.',
        error: err.message || 'Connection refused to AI microservice',
      };
    }
  }

  async compareProgression(
    currentImagePath: string,
    previousImagePath: string
  ): Promise<AIProgressionResult> {
    try {
      const curBuffer = fs.readFileSync(currentImagePath);
      const prevBuffer = fs.readFileSync(previousImagePath);

      const formData = new FormData();
      formData.append('current_file', new Blob([curBuffer]), path.basename(currentImagePath));
      formData.append('previous_file', new Blob([prevBuffer]), path.basename(previousImagePath));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`${this.baseUrl}/compare-progression`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`AI progression service failed with HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      return {
        isAvailable: true,
        lesionCoveragePercentCurrent: data.lesionCoveragePercentCurrent,
        lesionCoveragePercentPrevious: data.lesionCoveragePercentPrevious,
        lesionDeltaPercent: data.lesionDeltaPercent,
        vegetativeIndexExGDelta: data.vegetativeIndexExGDelta,
        lightingInconsistencyFlag: data.lightingInconsistencyFlag,
        symptomTrend: data.symptomTrend,
        assessmentMethod: data.assessmentMethod || 'Computer Vision Excess Green & Lesion Area Analysis',
        scientificDisclaimer:
          'Estimated visual progression based on leaf colorimetry and necrotic area. Does not constitute clinical recovery validation.',
      };
    } catch (err: any) {
      return {
        isAvailable: false,
        lesionCoveragePercentCurrent: 0,
        lesionCoveragePercentPrevious: 0,
        lesionDeltaPercent: 0,
        vegetativeIndexExGDelta: 0,
        lightingInconsistencyFlag: false,
        symptomTrend: 'inconclusive',
        assessmentMethod: 'Progression comparison service unavailable',
        scientificDisclaimer: 'Automated progression service offline.',
        error: err.message,
      };
    }
  }
}

export const aiClient = new AIClientService();
