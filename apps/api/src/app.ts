import express from 'express';
import type { Db } from './db.ts';
import { errorHandler, notFound } from './errors.ts';

export type Clock = () => Date;

export type Deps = {
  db: Db;
  clock: Clock;
  publicWebUrl?: string;
};

export const createApp = ({ db }: Deps) => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10kb' }));

  const api = express.Router();
  api.get('/health', async (_req, res) => {
    await db.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });
  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
};
