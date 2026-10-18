import request from 'supertest';
import { app } from '../src/app';
import { store, inMemoryDb } from '../src/models/store';

describe('CropCare AI Backend Integration Tests', () => {
  let farmerToken: string;
  let expertToken: string;
  let otherFarmerToken: string;
  let farmerPlotId: string;

  beforeAll(async () => {
    inMemoryDb.clear();

    // 1. Register Farmer 1
    const farmerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Farmer Joe',
        email: 'joe@farm.com',
        password: 'Password123!',
        role: 'farmer',
        consent: { dataCollection: true, researchUse: true },
      });
    expect(farmerRes.status).toBe(201);
    farmerToken = farmerRes.body.token;

    // 2. Register Farmer 2 (to test cross-ownership isolation)
    const otherFarmerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Farmer Bob',
        email: 'bob@farm.com',
        password: 'Password123!',
        role: 'farmer',
        consent: { dataCollection: true, researchUse: true },
      });
    expect(otherFarmerRes.status).toBe(201);
    otherFarmerToken = otherFarmerRes.body.token;

    // 3. Register Agricultural Expert
    const expertRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Expert',
        email: 'expert@agri.org',
        password: 'Password123!',
        role: 'expert',
        consent: { dataCollection: true, researchUse: true },
      });
    expect(expertRes.status).toBe(201);
    expertToken = expertRes.body.token;
  });

  describe('Module 1: Authentication & RBAC', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'joe@farm.com', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should login successfully and return JWT profile', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'joe@farm.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('joe@farm.com');
    });

    it('should retrieve current user profile from token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Farmer Joe');
    });

    it('should deny unauthorized requests without token', async () => {
      const res = await request(app).get('/api/plots');
      expect(res.status).toBe(401);
    });
  });

  describe('Module 2: Plot Management & Ownership Checks', () => {
    it('should allow farmer to create a plot', async () => {
      const res = await request(app)
        .post('/api/plots')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          name: 'Tomato Field Alpha',
          cropType: 'Tomato',
          variety: 'San Marzano',
          plantingDate: '2026-03-15',
          location: { lat: 38.5, lng: -121.5, region: 'Yolo County' },
          plotSizeAcres: 5.2,
          notes: 'Drip irrigated plot',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.plot.name).toBe('Tomato Field Alpha');
      farmerPlotId = res.body.plot._id;
    });

    it('should list only plots owned by the farmer', async () => {
      const res = await request(app)
        .get('/api/plots')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.plots.length).toBe(1);
      expect(res.body.plots[0]._id).toBe(farmerPlotId);
    });

    it('should prevent another farmer from viewing or altering private plot', async () => {
      const res = await request(app)
        .get(`/api/plots/${farmerPlotId}`)
        .set('Authorization', `Bearer ${otherFarmerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('Module 5: Weather-Aware Risk Evaluation', () => {
    it('should evaluate agronomic risk for plot using real or cached weather', async () => {
      const res = await request(app)
        .get(`/api/plots/${farmerPlotId}/risk`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.assessment).toBeDefined();
      expect(typeof res.body.assessment.riskScore).toBe('number');
      expect(res.body.assessment.rulesApplied.length).toBeGreaterThan(0);
      expect(res.body.assessment.agronomicRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Module 6: Role Enforcement on Expert Review Queue', () => {
    it('should forbid farmers from accessing the expert review queue', async () => {
      const res = await request(app)
        .get('/api/expert/queue')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow agricultural expert to access the review queue', async () => {
      const res = await request(app)
        .get('/api/expert/queue')
        .set('Authorization', `Bearer ${expertToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.queue)).toBe(true);
    });
  });

  describe('Module 7: Analytics & Reports', () => {
    it('should generate comprehensive plot report', async () => {
      const res = await request(app)
        .get(`/api/reports/plots/${farmerPlotId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report.plotSummary.name).toBe('Tomato Field Alpha');
      expect(res.body.report.disclaimer).toBeDefined();
    });

    it('should return research protocol and metrics specifications', async () => {
      const res = await request(app)
        .get('/api/reports/research')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.taxonomy).toContain('tomato_early_blight');
      expect(res.body.hypotheses.length).toBeGreaterThanOrEqual(3);
    });
  });
});
