export type UserRole = 'farmer' | 'expert' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage?: string;
  consent: {
    dataCollection: boolean;
    researchUse: boolean;
  };
}

export type CropType = 'Tomato' | 'Potato' | 'Corn' | 'Grape' | 'Bell Pepper';

export interface Plot {
  _id: string;
  ownerId: string;
  name: string;
  cropType: CropType;
  variety?: string;
  plantingDate: string;
  location: {
    lat?: number;
    lng?: number;
    region: string;
  };
  plotSizeAcres?: number;
  observationSchedule?: string;
  status: 'active' | 'archived';
  notes?: string;
  createdAt: string;
}

export interface WeatherSnapshot {
  temperatureC?: number;
  relativeHumidityPercent?: number;
  precipitationMm?: number;
  windSpeedKmh?: number;
  conditionsSummary?: string;
  capturedAt: string;
  source: string;
  isStaleOrUnavailable?: boolean;
}

export interface ImageQuality {
  isAcceptable: boolean;
  blurVariance?: number;
  meanBrightness?: number;
  width?: number;
  height?: number;
  rejectionReason?: string;
}

export interface ClassProbability {
  className: string;
  displayName: string;
  crop: string;
  condition: string;
  probability: number;
  isHealthy: boolean;
}

export interface Prediction {
  _id: string;
  observationId: string;
  plotId: string;
  modelVersion: string;
  topClass: string;
  topDisplayName: string;
  confidence: number;
  entropy: number;
  accepted: boolean;
  reviewReason?: string;
  classProbabilities: ClassProbability[];
  limitationsNotice: string;
  generatedAt: string;
}

export interface ExpertReview {
  _id: string;
  observationId: string;
  plotId: string;
  farmerId: string;
  farmerName?: string;
  expertId?: string;
  expertName?: string;
  status: 'pending' | 'in_progress' | 'completed';
  verifiedDiagnosis?: string;
  severityRating?: number; // 1 to 5
  clinicalAssessment?: string;
  recommendedIntervention?: string;
  requestedAt: string;
  reviewedAt?: string;
}

export interface Observation {
  _id: string;
  plotId: string;
  ownerId: string;
  imageUrl: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  timestamp: string;
  symptomsReported?: string;
  imageQuality?: ImageQuality;
  weatherSnapshot?: WeatherSnapshot;
  predictionId?: string;
  prediction?: Prediction | null;
  expertReviewRequested?: boolean;
  expertReview?: ExpertReview | null;
  notes?: string;
  createdAt: string;
}

export type SymptomTrend = 'improving' | 'stable' | 'worsening' | 'inconclusive';

export interface ProgressRecord {
  _id: string;
  plotId: string;
  currentObservationId: string;
  previousObservationId?: string;
  symptomTrend: SymptomTrend;
  lesionCoveragePercentCurrent: number;
  lesionCoveragePercentPrevious?: number;
  lesionDeltaPercent?: number;
  vegetativeIndexExGDelta?: number;
  lightingInconsistencyFlag: boolean;
  assessmentMethod: string;
  scientificDisclaimer: string;
  notes?: string;
  evaluatedAt: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface RiskAssessment {
  _id: string;
  plotId: string;
  cropType: string;
  riskScore: number;
  riskLevel: RiskLevel;
  primaryThreats: string[];
  riskFactors: string[];
  rulesApplied: string[];
  weatherSnapshot?: WeatherSnapshot;
  agronomicRecommendations: string[];
  generatedAt: string;
}

export interface Intervention {
  _id: string;
  plotId: string;
  ownerId: string;
  date: string;
  interventionType: 'fungicide' | 'fertilizer' | 'irrigation' | 'pruning' | 'pesticide' | 'other';
  productUsed?: string;
  reportedCost?: number;
  dosage?: string;
  notes?: string;
  createdAt: string;
}
