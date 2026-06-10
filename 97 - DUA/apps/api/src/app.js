import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, assertEnv } from './config/env.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import duaRoutes from './routes/dua.routes.js';
import userRoutes from './routes/user.routes.js';

assertEnv();

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/duas', duaRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: true, message: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  if (env.nodeEnv !== 'test') console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    error: true,
    message: status === 500 ? 'Unexpected server error' : error.message,
    ...(error.code ? { code: error.code } : {})
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
}
