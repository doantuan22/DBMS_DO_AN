import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { createAuthRateLimiter } from './middleware/authRateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import routes from './routes/index.js';

export function createApp({ authRateLimit } = {}) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use('/api/auth', createAuthRateLimiter(authRateLimit));
  app.use(express.json());
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
