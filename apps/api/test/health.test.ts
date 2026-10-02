import request from 'supertest';
import { afterAll, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { createDb } from '../src/db.ts';

const db = createDb(process.env.DATABASE_URL!);
const app = createApp({ db, clock: () => new Date() });
afterAll(() => db.$disconnect());

it('reports health after reaching the database', async () => {
  const res = await request(app).get('/api/health').expect(200);
  expect(res.body).toEqual({ ok: true });
});
