import express from 'express';
import { apiRouter } from './routes/api.js';

export function createExpressApp() {
  const app = express();

  app.use(express.json());

  // CORS headers for production and Vercel environments
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  return app;
}

export const app = createExpressApp();
