import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,

  env: process.env.NODE_ENV || 'development',

  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,

  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
};
