import { afterAll, beforeAll, expect, it } from 'vitest';
import type { TemplateDefinition } from '../src/templates/definitions.ts';
import { upsertTemplate } from '../src/templates/store.ts';
import { api, createBody, db, outcome, tally } from './helpers.ts';

const euchre: TemplateDefinition = {
  id: 'euchre',
  name: 'Euchre',
  defaultCapacity: 16,
  maxCapacity: 28,
  minPlayers: 8,
  defaultDurationMinutes: 120,
  formats: [{ id: 'tournament', name: 'Tournament', capacityStep: 4 }],
};

const http = await api();
const create = (capacity: number) =>
  http.post('/api/events').send(createBody({ templateId: 'euchre', formatId: 'tournament', capacity }));

beforeAll(() => upsertTemplate(db, euchre));
afterAll(async () => {
  await db.event.deleteMany({ where: { templateId: 'euchre' } });
  await db.gameTemplate.delete({ where: { id: 'euchre' } });
});

it('adds a 4th game through the seed upsert alone: listed, step enforced, fills to capacity', async () => {
  const templates = await http.get('/api/templates');
  expect(templates.body).toContainEqual(expect.objectContaining({ id: 'euchre', formats: [expect.objectContaining({ capacityStep: 4 })] }));
  expect(outcome(await create(10))).toBe('400 VALIDATION_FAILED capacity');
  const event = await create(8);
  const responses = await Promise.all(
    Array.from({ length: 9 }, (_, i) => http.post(`/api/events/${event.body.id}/registrations`).send({ name: `Player ${i}` })),
  );
  expect(tally(responses)).toEqual({ '201': 8, '409 EVENT_FULL': 1 });
});

it('rejects a definition whose default capacity is off its step', async () => {
  await expect(upsertTemplate(db, { ...euchre, id: 'euchre-bad', defaultCapacity: 18 })).rejects.toThrow(/multiple of 4/);
});
