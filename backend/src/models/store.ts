import { v4 as uuidv4 } from 'uuid';
import mongoose, { Schema } from 'mongoose';
import {
  IUser,
  IPlot,
  IObservation,
  IPrediction,
  IProgressRecord,
  IRiskAssessment,
  IExpertReview,
  IIntervention,
  IAuditLog,
} from './types';

// ==========================================
// Mongoose Schemas (when MongoDB is active)
// ==========================================

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, default: uuidv4 },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'expert', 'admin'], default: 'farmer' },
    preferredLanguage: { type: String, default: 'en' },
    consent: {
      dataCollection: { type: Boolean, default: true },
      researchUse: { type: Boolean, default: true },
      timestamp: { type: String, default: () => new Date().toISOString() },
    },
  },
  { timestamps: true }
);

const PlotSchema = new Schema<IPlot>(
  {
    _id: { type: String, default: uuidv4 },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    cropType: { type: String, required: true },
    variety: { type: String },
    plantingDate: { type: String, required: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      region: { type: String, required: true },
    },
    plotSizeAcres: { type: Number },
    observationSchedule: { type: String },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    notes: { type: String },
  },
  { timestamps: true }
);

const ObservationSchema = new Schema<IObservation>(
  {
    _id: { type: String, default: uuidv4 },
    plotId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    originalFileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    timestamp: { type: String, required: true },
    symptomsReported: { type: String },
    imageQuality: { type: Schema.Types.Mixed },
    weatherSnapshot: { type: Schema.Types.Mixed },
    predictionId: { type: String },
    expertReviewRequested: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

const PredictionSchema = new Schema<IPrediction>(
  {
    _id: { type: String, default: uuidv4 },
    observationId: { type: String, required: true, index: true },
    plotId: { type: String, required: true, index: true },
    modelVersion: { type: String, required: true },
    topClass: { type: String, required: true },
    topDisplayName: { type: String, required: true },
    confidence: { type: Number, required: true },
    entropy: { type: Number, required: true },
    accepted: { type: Boolean, required: true },
    reviewReason: { type: String },
    classProbabilities: [{ type: Schema.Types.Mixed }],
    limitationsNotice: { type: String, required: true },
    generatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

const ProgressRecordSchema = new Schema<IProgressRecord>(
  {
    _id: { type: String, default: uuidv4 },
    plotId: { type: String, required: true, index: true },
    currentObservationId: { type: String, required: true },
    previousObservationId: { type: String },
    symptomTrend: { type: String, required: true },
    lesionCoveragePercentCurrent: { type: Number, required: true },
    lesionCoveragePercentPrevious: { type: Number },
    lesionDeltaPercent: { type: Number },
    vegetativeIndexExGDelta: { type: Number },
    lightingInconsistencyFlag: { type: Boolean, default: false },
    assessmentMethod: { type: String, required: true },
    scientificDisclaimer: { type: String, required: true },
    notes: { type: String },
    evaluatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

const RiskAssessmentSchema = new Schema<IRiskAssessment>(
  {
    _id: { type: String, default: uuidv4 },
    plotId: { type: String, required: true, index: true },
    cropType: { type: String, required: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    primaryThreats: [{ type: String }],
    riskFactors: [{ type: String }],
    rulesApplied: [{ type: String }],
    weatherSnapshot: { type: Schema.Types.Mixed },
    agronomicRecommendations: [{ type: String }],
    generatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

const ExpertReviewSchema = new Schema<IExpertReview>(
  {
    _id: { type: String, default: uuidv4 },
    observationId: { type: String, required: true, index: true },
    plotId: { type: String, required: true, index: true },
    farmerId: { type: String, required: true },
    expertId: { type: String },
    expertName: { type: String },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    verifiedDiagnosis: { type: String },
    severityRating: { type: Number },
    clinicalAssessment: { type: String },
    recommendedIntervention: { type: String },
    requestedAt: { type: String, required: true },
    reviewedAt: { type: String },
  },
  { timestamps: true }
);

const InterventionSchema = new Schema<IIntervention>(
  {
    _id: { type: String, default: uuidv4 },
    plotId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    interventionType: { type: String, required: true },
    productUsed: { type: String },
    reportedCost: { type: Number },
    dosage: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const AuditLogSchema = new Schema<IAuditLog>(
  {
    _id: { type: String, default: uuidv4 },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    outcome: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const PlotModel = mongoose.models.Plot || mongoose.model<IPlot>('Plot', PlotSchema);
export const ObservationModel = mongoose.models.Observation || mongoose.model<IObservation>('Observation', ObservationSchema);
export const PredictionModel = mongoose.models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);
export const ProgressRecordModel = mongoose.models.ProgressRecord || mongoose.model<IProgressRecord>('ProgressRecord', ProgressRecordSchema);
export const RiskAssessmentModel = mongoose.models.RiskAssessment || mongoose.model<IRiskAssessment>('RiskAssessment', RiskAssessmentSchema);
export const ExpertReviewModel = mongoose.models.ExpertReview || mongoose.model<IExpertReview>('ExpertReview', ExpertReviewSchema);
export const InterventionModel = mongoose.models.Intervention || mongoose.model<IIntervention>('Intervention', InterventionSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// ===================================================
// Memory Store Fallback (Ensures zero-downtime tests)
// ===================================================

class InMemoryStore {
  public users: Map<string, IUser> = new Map();
  public plots: Map<string, IPlot> = new Map();
  public observations: Map<string, IObservation> = new Map();
  public predictions: Map<string, IPrediction> = new Map();
  public progressRecords: Map<string, IProgressRecord> = new Map();
  public riskAssessments: Map<string, IRiskAssessment> = new Map();
  public expertReviews: Map<string, IExpertReview> = new Map();
  public interventions: Map<string, IIntervention> = new Map();
  public auditLogs: IAuditLog[] = [];

  clear() {
    this.users.clear();
    this.plots.clear();
    this.observations.clear();
    this.predictions.clear();
    this.progressRecords.clear();
    this.riskAssessments.clear();
    this.expertReviews.clear();
    this.interventions.clear();
    this.auditLogs = [];
  }
}

export const inMemoryDb = new InMemoryStore();

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// ===================================================
// Repository Methods (Seamlessly works with or without Mongo)
// ===================================================

export const store = {
  // Users
  users: {
    async create(user: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): Promise<IUser> {
      const now = new Date().toISOString();
      const record: IUser = {
        _id: user._id || uuidv4(),
        createdAt: now,
        updatedAt: now,
        ...user,
      };

      if (isMongoConnected()) {
        const doc = await UserModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.users.set(record._id, record);
      return { ...record };
    },

    async findById(id: string): Promise<IUser | null> {
      if (isMongoConnected()) {
        const doc = await UserModel.findById(id).lean();
        return (doc as unknown as IUser) || null;
      }
      return inMemoryDb.users.get(id) || null;
    },

    async findByEmail(email: string): Promise<IUser | null> {
      const normalized = email.toLowerCase().trim();
      if (isMongoConnected()) {
        const doc = await UserModel.findOne({ email: normalized }).lean();
        return (doc as unknown as IUser) || null;
      }
      for (const user of inMemoryDb.users.values()) {
        if (user.email.toLowerCase() === normalized) return { ...user };
      }
      return null;
    },

    async findAll(): Promise<IUser[]> {
      if (isMongoConnected()) {
        const docs = await UserModel.find().lean();
        return docs as unknown as IUser[];
      }
      return Array.from(inMemoryDb.users.values());
    },
  },

  // Plots
  plots: {
    async create(plot: Omit<IPlot, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): Promise<IPlot> {
      const now = new Date().toISOString();
      const record: IPlot = {
        ...plot,
        _id: plot._id || uuidv4(),
        status: plot.status || 'active',
        createdAt: now,
        updatedAt: now,
      };
      if (isMongoConnected()) {
        const doc = await PlotModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.plots.set(record._id, record);
      return { ...record };
    },

    async findById(id: string): Promise<IPlot | null> {
      if (isMongoConnected()) {
        const doc = await PlotModel.findById(id).lean();
        return (doc as unknown as IPlot) || null;
      }
      return inMemoryDb.plots.get(id) || null;
    },

    async findByOwner(ownerId: string): Promise<IPlot[]> {
      if (isMongoConnected()) {
        const docs = await PlotModel.find({ ownerId }).sort({ createdAt: -1 }).lean();
        return docs as unknown as IPlot[];
      }
      return Array.from(inMemoryDb.plots.values())
        .filter((p) => p.ownerId === ownerId)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    },

    async findAll(): Promise<IPlot[]> {
      if (isMongoConnected()) {
        const docs = await PlotModel.find().sort({ createdAt: -1 }).lean();
        return docs as unknown as IPlot[];
      }
      return Array.from(inMemoryDb.plots.values()).sort((a, b) =>
        b.createdAt > a.createdAt ? 1 : -1
      );
    },

    async update(id: string, updates: Partial<IPlot>): Promise<IPlot | null> {
      const now = new Date().toISOString();
      if (isMongoConnected()) {
        const doc = await PlotModel.findByIdAndUpdate(
          id,
          { ...updates, updatedAt: now },
          { new: true }
        ).lean();
        return (doc as unknown as IPlot) || null;
      }
      const existing = inMemoryDb.plots.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates, updatedAt: now };
      inMemoryDb.plots.set(id, updated);
      return { ...updated };
    },

    async delete(id: string): Promise<boolean> {
      if (isMongoConnected()) {
        const res = await PlotModel.findByIdAndDelete(id);
        return !!res;
      }
      return inMemoryDb.plots.delete(id);
    },
  },

  // Observations
  observations: {
    async create(obs: Omit<IObservation, '_id' | 'createdAt'> & { _id?: string }): Promise<IObservation> {
      const record: IObservation = {
        _id: obs._id || uuidv4(),
        createdAt: new Date().toISOString(),
        ...obs,
      };
      if (isMongoConnected()) {
        const doc = await ObservationModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.observations.set(record._id, record);
      return { ...record };
    },

    async findById(id: string): Promise<IObservation | null> {
      if (isMongoConnected()) {
        const doc = await ObservationModel.findById(id).lean();
        return (doc as unknown as IObservation) || null;
      }
      return inMemoryDb.observations.get(id) || null;
    },

    async findByPlot(plotId: string): Promise<IObservation[]> {
      if (isMongoConnected()) {
        const docs = await ObservationModel.find({ plotId }).sort({ timestamp: -1 }).lean();
        return docs as unknown as IObservation[];
      }
      return Array.from(inMemoryDb.observations.values())
        .filter((o) => o.plotId === plotId)
        .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    },

    async findByOwner(ownerId: string): Promise<IObservation[]> {
      if (isMongoConnected()) {
        const docs = await ObservationModel.find({ ownerId }).sort({ timestamp: -1 }).lean();
        return docs as unknown as IObservation[];
      }
      return Array.from(inMemoryDb.observations.values())
        .filter((o) => o.ownerId === ownerId)
        .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    },

    async update(id: string, updates: Partial<IObservation>): Promise<IObservation | null> {
      if (isMongoConnected()) {
        const doc = await ObservationModel.findByIdAndUpdate(id, updates, { new: true }).lean();
        return (doc as unknown as IObservation) || null;
      }
      const existing = inMemoryDb.observations.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      inMemoryDb.observations.set(id, updated);
      return { ...updated };
    },
  },

  // Predictions
  predictions: {
    async create(pred: Omit<IPrediction, '_id'> & { _id?: string }): Promise<IPrediction> {
      const record: IPrediction = {
        _id: pred._id || uuidv4(),
        ...pred,
      };
      if (isMongoConnected()) {
        const doc = await PredictionModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.predictions.set(record._id, record);
      return { ...record };
    },

    async findById(id: string): Promise<IPrediction | null> {
      if (isMongoConnected()) {
        const doc = await PredictionModel.findById(id).lean();
        return (doc as unknown as IPrediction) || null;
      }
      return inMemoryDb.predictions.get(id) || null;
    },

    async findByObservation(observationId: string): Promise<IPrediction | null> {
      if (isMongoConnected()) {
        const doc = await PredictionModel.findOne({ observationId }).lean();
        return (doc as unknown as IPrediction) || null;
      }
      for (const p of inMemoryDb.predictions.values()) {
        if (p.observationId === observationId) return { ...p };
      }
      return null;
    },
  },

  // Progress Records
  progressRecords: {
    async create(rec: Omit<IProgressRecord, '_id'> & { _id?: string }): Promise<IProgressRecord> {
      const record: IProgressRecord = {
        _id: rec._id || uuidv4(),
        ...rec,
      };
      if (isMongoConnected()) {
        const doc = await ProgressRecordModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.progressRecords.set(record._id, record);
      return { ...record };
    },

    async findByPlot(plotId: string): Promise<IProgressRecord[]> {
      if (isMongoConnected()) {
        const docs = await ProgressRecordModel.find({ plotId }).sort({ evaluatedAt: -1 }).lean();
        return docs as unknown as IProgressRecord[];
      }
      return Array.from(inMemoryDb.progressRecords.values())
        .filter((r) => r.plotId === plotId)
        .sort((a, b) => (b.evaluatedAt > a.evaluatedAt ? 1 : -1));
    },
  },

  // Risk Assessments
  riskAssessments: {
    async create(risk: Omit<IRiskAssessment, '_id'> & { _id?: string }): Promise<IRiskAssessment> {
      const record: IRiskAssessment = {
        _id: risk._id || uuidv4(),
        ...risk,
      };
      if (isMongoConnected()) {
        const doc = await RiskAssessmentModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.riskAssessments.set(record._id, record);
      return { ...record };
    },

    async findLatestByPlot(plotId: string): Promise<IRiskAssessment | null> {
      if (isMongoConnected()) {
        const doc = await RiskAssessmentModel.findOne({ plotId }).sort({ generatedAt: -1 }).lean();
        return (doc as unknown as IRiskAssessment) || null;
      }
      const list = Array.from(inMemoryDb.riskAssessments.values())
        .filter((r) => r.plotId === plotId)
        .sort((a, b) => (b.generatedAt > a.generatedAt ? 1 : -1));
      return list[0] || null;
    },
  },

  // Expert Reviews
  expertReviews: {
    async create(review: Omit<IExpertReview, '_id'> & { _id?: string }): Promise<IExpertReview> {
      const record: IExpertReview = {
        _id: review._id || uuidv4(),
        ...review,
      };
      if (isMongoConnected()) {
        const doc = await ExpertReviewModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.expertReviews.set(record._id, record);
      return { ...record };
    },

    async findById(id: string): Promise<IExpertReview | null> {
      if (isMongoConnected()) {
        const doc = await ExpertReviewModel.findById(id).lean();
        return (doc as unknown as IExpertReview) || null;
      }
      return inMemoryDb.expertReviews.get(id) || null;
    },

    async findByObservation(observationId: string): Promise<IExpertReview | null> {
      if (isMongoConnected()) {
        const doc = await ExpertReviewModel.findOne({ observationId }).lean();
        return (doc as unknown as IExpertReview) || null;
      }
      for (const r of inMemoryDb.expertReviews.values()) {
        if (r.observationId === observationId) return { ...r };
      }
      return null;
    },

    async findPending(): Promise<IExpertReview[]> {
      if (isMongoConnected()) {
        const docs = await ExpertReviewModel.find({ status: 'pending' })
          .sort({ requestedAt: 1 })
          .lean();
        return docs as unknown as IExpertReview[];
      }
      return Array.from(inMemoryDb.expertReviews.values())
        .filter((r) => r.status === 'pending')
        .sort((a, b) => (a.requestedAt > b.requestedAt ? 1 : -1));
    },

    async findAll(): Promise<IExpertReview[]> {
      if (isMongoConnected()) {
        const docs = await ExpertReviewModel.find().sort({ requestedAt: -1 }).lean();
        return docs as unknown as IExpertReview[];
      }
      return Array.from(inMemoryDb.expertReviews.values()).sort((a, b) =>
        b.requestedAt > a.requestedAt ? 1 : -1
      );
    },

    async update(id: string, updates: Partial<IExpertReview>): Promise<IExpertReview | null> {
      if (isMongoConnected()) {
        const doc = await ExpertReviewModel.findByIdAndUpdate(id, updates, { new: true }).lean();
        return (doc as unknown as IExpertReview) || null;
      }
      const existing = inMemoryDb.expertReviews.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      inMemoryDb.expertReviews.set(id, updated);
      return { ...updated };
    },
  },

  // Interventions
  interventions: {
    async create(interv: Omit<IIntervention, '_id' | 'createdAt'> & { _id?: string }): Promise<IIntervention> {
      const record: IIntervention = {
        _id: interv._id || uuidv4(),
        createdAt: new Date().toISOString(),
        ...interv,
      };
      if (isMongoConnected()) {
        const doc = await InterventionModel.create(record);
        return doc.toObject();
      }
      inMemoryDb.interventions.set(record._id, record);
      return { ...record };
    },

    async findByPlot(plotId: string): Promise<IIntervention[]> {
      if (isMongoConnected()) {
        const docs = await InterventionModel.find({ plotId }).sort({ date: -1 }).lean();
        return docs as unknown as IIntervention[];
      }
      return Array.from(inMemoryDb.interventions.values())
        .filter((i) => i.plotId === plotId)
        .sort((a, b) => (b.date > a.date ? 1 : -1));
    },
  },

  // Audit Logs
  auditLogs: {
    async create(log: Omit<IAuditLog, '_id' | 'timestamp'>): Promise<IAuditLog> {
      const record: IAuditLog = {
        _id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...log,
      };
      if (isMongoConnected()) {
        await AuditLogModel.create(record);
        return record;
      }
      inMemoryDb.auditLogs.unshift(record);
      if (inMemoryDb.auditLogs.length > 500) inMemoryDb.auditLogs.pop();
      return { ...record };
    },

    async findRecent(limit = 100): Promise<IAuditLog[]> {
      if (isMongoConnected()) {
        const docs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(limit).lean();
        return docs as unknown as IAuditLog[];
      }
      return inMemoryDb.auditLogs.slice(0, limit);
    },
  },
};
