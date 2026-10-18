import {
  User,
  Plot,
  Observation,
  Prediction,
  ProgressRecord,
  RiskAssessment,
  ExpertReview,
  Intervention,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cropcare_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(payload: {
      name: string;
      email: string;
      password: string;
      role: string;
      consent: { dataCollection: boolean; researchUse: boolean };
    }) {
      return request<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    async login(payload: { email: string; password: string }) {
      return request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    async getMe() {
      return request<{ success: boolean; user: User }>('/auth/me');
    },
  },

  plots: {
    async list() {
      return request<{ success: boolean; plots: Plot[] }>('/plots');
    },

    async getById(id: string) {
      return request<{ success: boolean; plot: Plot }>(`/plots/${id}`);
    },

    async create(plot: Partial<Plot>) {
      return request<{ success: boolean; plot: Plot }>('/plots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plot),
      });
    },

    async update(id: string, updates: Partial<Plot>) {
      return request<{ success: boolean; plot: Plot }>(`/plots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    },

    async getHistory(plotId: string) {
      return request<{
        success: boolean;
        plot: Plot;
        observations: Observation[];
        interventions: Intervention[];
        progressRecords: ProgressRecord[];
      }>(`/plots/${plotId}/history`);
    },

    async getRisk(plotId: string) {
      return request<{ success: boolean; assessment: RiskAssessment }>(`/plots/${plotId}/risk`);
    },

    async getProgression(plotId: string) {
      return request<{ success: boolean; progressRecords: ProgressRecord[] }>(
        `/plots/${plotId}/progression`
      );
    },
  },

  observations: {
    async upload(formData: FormData) {
      const headers = getAuthHeader();
      const res = await fetch(`${API_BASE}/observations`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data as { success: boolean; observation: Observation };
    },

    async analyze(observationId: string) {
      return request<{
        success: boolean;
        prediction: Prediction;
        progressRecord: ProgressRecord | null;
        observation: Observation;
      }>(`/observations/${observationId}/analyze`, {
        method: 'POST',
      });
    },

    async requestReview(observationId: string) {
      return request<{ success: boolean; review: ExpertReview; message: string }>(
        `/observations/${observationId}/review`,
        { method: 'POST' }
      );
    },

    async getById(id: string) {
      return request<{ success: boolean; observation: Observation }>(`/observations/${id}`);
    },
  },

  interventions: {
    async create(payload: Partial<Intervention>) {
      return request<{ success: boolean; intervention: Intervention }>('/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    async listByPlot(plotId: string) {
      return request<{ success: boolean; interventions: Intervention[] }>(
        `/interventions/plot/${plotId}`
      );
    },
  },

  expert: {
    async getQueue() {
      return request<{ success: boolean; queue: any[] }>('/expert/queue');
    },

    async submitReview(payload: {
      reviewId: string;
      verifiedDiagnosis: string;
      severityRating: number;
      clinicalAssessment: string;
      recommendedIntervention: string;
    }) {
      return request<{ success: boolean; review: ExpertReview }>('/expert/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
  },

  reports: {
    async getPlotReport(plotId: string) {
      return request<{ success: boolean; report: any }>(`/reports/plots/${plotId}`);
    },

    async getResearchMetrics() {
      return request<{ success: boolean; [key: string]: any }>('/reports/research');
    },
  },

  health: {
    async check() {
      return request<{
        status: string;
        service: string;
        database: string;
        aiService: any;
        timestamp: string;
      }>('/health');
    },
  },
};
