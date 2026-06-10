import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'AdminPass123!'
};

export function assertEnv() {
  const missing = [];
  if (!env.databaseUrl) missing.push('DATABASE_URL');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (!env.redisUrl) missing.push('REDIS_URL');
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
