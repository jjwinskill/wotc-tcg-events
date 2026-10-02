import express from 'express';
import type { Db } from './db.ts';
import { errorHandler, notFound } from './errors.ts';
import { createEventController } from './events/controller.ts';
import { createEventService } from './events/service.ts';
import { listTemplates } from './templates/store.ts';

export type Clock = () => Date;

export type Deps = {
  db: Db;
  clock: Clock;
  publicWebUrl?: string;
};

export const createApp = ({ db, clock, publicWebUrl }: Deps) => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10kb' }));

  const events = createEventController(createEventService({ db, clock }), publicWebUrl);
  const api = express.Router();
  api.get('/health', async (_req, res) => {
    await db.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });
  api.get('/templates', async (_req, res) => {
    res.json(await listTemplates(db));
  });
  api.get('/events', events.list);
  api.post('/events', events.create);
  api.get('/events/:id', events.get);
  api.get('/events/:id/invite.ics', events.invite);
  api.post('/events/:id/registrations', events.register);
  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
};
