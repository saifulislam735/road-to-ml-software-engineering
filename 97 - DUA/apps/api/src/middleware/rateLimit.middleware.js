import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { env } from '../config/env.js';

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: env.redisUrl });
    redisClient.on('error', (error) => console.error('Redis error', error));
    await redisClient.connect();
  }
  return redisClient;
}

function createLimiter(max) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: 'Too many requests' },
    store: new RedisStore({
      sendCommand: async (...args) => {
        const client = await getRedisClient();
        return client.sendCommand(args);
      }
    })
  });
}

export const duaSendLimiter = createLimiter(5);
export const reportLimiter = createLimiter(5);
export const authLimiter = createLimiter(10);
