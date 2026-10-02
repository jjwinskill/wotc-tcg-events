import { once } from 'node:events';
import request, { type Response } from 'supertest';
import { afterAll } from 'vitest';
import { createApp, type Deps } from '../src/app.ts';
import { createDb } from '../src/db.ts';
import type { Prisma } from '../src/generated/prisma/client.ts';

export const db = createDb(process.env.DATABASE_URL!);
afterAll(async () => {
  await db.event.deleteMany();
  await db.$disconnect();
});

/** Serves the app on 127.0.0.1 for the whole file, so concurrent requests share one server. */
export async function api(deps: Partial<Deps> = {}) {
  const server = createApp({ db, clock: () => new Date(), ...deps }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  afterAll(() => new Promise((done) => server.close(done)));
  return request(server);
}

const QUARTER_HOUR = 15 * 60_000;
export const nextWeek = () => new Date(Math.ceil((Date.now() + 7 * 24 * 3_600_000) / QUARTER_HOUR) * QUARTER_HOUR);

export const createBody = (over: object = {}) => ({
  name: 'Friday Night Magic',
  templateId: 'mtg',
  formatId: 'standard',
  startsAt: nextWeek().toISOString(),
  location: 'Main Street Games',
  ...over,
});

export const insertEvent = (data: Partial<Prisma.EventUncheckedCreateInput> = {}) =>
  db.event.create({
    data: {
      name: 'Test Event',
      templateId: 'mtg',
      formatId: 'standard',
      startsAt: nextWeek(),
      durationMinutes: 180,
      capacity: 30,
      minPlayers: 4,
      location: 'Main Street Games',
      ...data,
    },
  });

/** One comparable string per response: "201", "409 EVENT_FULL" or "400 VALIDATION_FAILED capacity". */
export const outcome = (r: Response) =>
  [r.status, r.body.error?.code, ...Object.keys(r.body.error?.details?.fieldErrors ?? {})].filter(Boolean).join(' ');

export const tally = (responses: Response[]) =>
  responses.reduce<Record<string, number>>((t, r) => ({ ...t, [outcome(r)]: (t[outcome(r)] ?? 0) + 1 }), {});
