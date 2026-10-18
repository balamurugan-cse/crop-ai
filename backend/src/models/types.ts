export type UserRole = 'farmer' | 'expert' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  preferredLanguage?: string;
  consent: {
    dataCollection: boolean;
    researchUse: boolean;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type CropType = 'Tomato' | 'Potato' | 'Corn' | 'Grape' | 'Bell Pepper';

export interface IPlot {
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
  updatedAt: string;
}

export interface IWeatherSnapshot {
  temperatureC?: number;
  relativeHumidityPercent?: number;
  precipitationMm?: number;
  windSpeedKmh?: number;
  conditionsSummary?: string;
  capturedAt: string;
  source: string;
  isStaleOrUnavailable?: boolean;
}

export interface IImageQuality {
  isAcceptable: boolean;
  blurVariance?: number;
  meanBrightness?: number;
  width?: number;
  height?: number;
  rejectionReason?: string;
}

export interface IObservation {
  _id: string;
  plotId: string;
  ownerId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  timestamp: string;
  symptomsReported?: string;
  imageQuality?: IImageQuality;
  weatherSnapshot?: IWeatherSnapshot;
  predictionId?: string;
  expertReviewRequested?: boolean;
  notes?: string;
  createdAt: string;
}

export interface IClassProbability {
  className: string;
  displayName: string;
  crop: string;
  condition: string;
  probability: number;
  isHealthy: boolean;
}

export interface IPrediction {
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
  classProbabilities: IClassProbability[];
  limitationsNotice: string;
  generatedAt: string;
}

export type SymptomTrend = 'improving' | 'stable' | 'worsening' | 'inconclusive';

export interface IProgressRecord {
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

export interface IRiskAssessment {
  _id: string;
  plotId: string;
  cropType: string;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  primaryThreats: string[];
  riskFactors: string[];
  rulesApplied: string[];
  weatherSnapshot?: IWeatherSnapshot;
  agronomicRecommendations: string[];
  generatedAt: string;
}

export interface IExpertReview {
  _id: string;
  observationId: string;
  plotId: string;
  farmerId: string;
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

export interface IIntervention {
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

export interface IAuditLog {
  _id: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  outcome: 'success' | 'failure';
  timestamp: string;
}
