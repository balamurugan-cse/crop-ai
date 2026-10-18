import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or backend
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'cropcare_jwt_super_secure_development_secret_key_2026_xyz',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cropcare',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  uploadDir: path.resolve(__dirname, '../../uploads'),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.65'),
  uncertaintyEntropyLimit: parseFloat(process.env.UNCERTAINTY_ENTROPY_LIMIT || '1.20'),
  weatherProvider: process.env.WEATHER_PROVIDER || 'open-meteo',
  weatherApiKey: process.env.WEATHER_API_KEY || '',
};
