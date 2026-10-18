import mongoose from 'mongoose';
import { app } from './app';
import { config } from './config/env';
import { store } from './models/store';
import bcrypt from 'bcryptjs';

async function bootstrap() {
  console.log('🌾 Initializing CropCare AI Backend Service...');

  // Attempt MongoDB connection if configured
  if (config.mongodbUri) {
    try {
      console.log(`Connecting to MongoDB at: ${config.mongodbUri}...`);
      await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('✅ Connected to MongoDB successfully.');
    } catch (err: any) {
      console.warn(`⚠️ MongoDB connection unavailable (${err.message}).`);
      console.log('ℹ️ Running with zero-config in-memory persistence store. All data operations are active.');
    }
  }

  // Seed default demonstration users if not present
  try {
    const existingAdmin = await store.users.findByEmail('admin@cropcare.ai');
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash('CropCare2026!', salt);

      // 1. Admin
      await store.users.create({
        name: 'CropCare Administrator',
        email: 'admin@cropcare.ai',
        passwordHash: defaultPassword,
        role: 'admin',
        preferredLanguage: 'en',
        consent: { dataCollection: true, researchUse: true, timestamp: new Date().toISOString() },
      });

      // 2. Agricultural Expert
      await store.users.create({
        name: 'Dr. Sarah Lin (Agronomist)',
        email: 'expert@cropcare.ai',
        passwordHash: defaultPassword,
        role: 'expert',
        preferredLanguage: 'en',
        consent: { dataCollection: true, researchUse: true, timestamp: new Date().toISOString() },
      });

      // 3. Demo Farmer
      const farmer = await store.users.create({
        name: 'John Miller (Valley Farm)',
        email: 'farmer@cropcare.ai',
        passwordHash: defaultPassword,
        role: 'farmer',
        preferredLanguage: 'en',
        consent: { dataCollection: true, researchUse: true, timestamp: new Date().toISOString() },
      });

      // Seed a sample plot for the demo farmer
      await store.plots.create({
        ownerId: farmer._id,
        name: 'North Tomato Field Plot 1',
        cropType: 'Tomato',
        variety: 'Roma Heirloom',
        plantingDate: '2026-03-01',
        location: {
          lat: 38.5816,
          lng: -121.4944,
          region: 'Sacramento Valley Agricultural District',
        },
        plotSizeAcres: 4.5,
        observationSchedule: 'Bi-weekly visual inspection',
        status: 'active',
        notes: 'Initial planting with drip irrigation lines.',
      });

      console.log('🌱 Seeded initial demo accounts (admin@cropcare.ai, expert@cropcare.ai, farmer@cropcare.ai with password: CropCare2026!)');
    }
  } catch (seedErr) {
    console.error('Error seeding demo accounts:', seedErr);
  }

  const server = app.listen(config.port, () => {
    console.log(`🚀 CropCare AI Backend running on http://localhost:${config.port}`);
    console.log(`📁 Local storage upload directory: ${config.uploadDir}`);
  });

  return server;
}

if (require.main === module) {
  bootstrap();
}
