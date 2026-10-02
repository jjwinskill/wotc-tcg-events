import type { RequestHandler } from 'express';
import type { Db } from '../db.ts';
import { listTemplates } from './store.ts';

// A rule-less read, so the controller goes straight to the data layer.
export const createTemplateController = (db: Db) => {
  const list: RequestHandler = async (_req, res) => {
    res.json(await listTemplates(db));
  };
  return { list };
};
