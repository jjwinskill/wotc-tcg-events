import { expect, it } from 'vitest';
import { api, db, insertEvent, outcome, tally } from './helpers.ts';

const http = await api();
let lateNow = new Date();
const late = await api({ clock: () => lateNow });

const register = (eventId: string, name: string) => http.post(`/api/events/${eventId}/registrations`).send({ name });

const seats = async (id: string) => {
  const e = await db.event.findUniqueOrThrow({
    where: { id },
    select: { registeredCount: true, _count: { select: { registrations: true } } },
  });
  return { registeredCount: e.registeredCount, rows: e._count.registrations };
};

it('admits exactly 30 of 50 concurrent distinct names to a 30-seat event, with zero 500s', async () => {
  const event = await insertEvent({ capacity: 30 });
  const responses = await Promise.all(Array.from({ length: 50 }, (_, i) => register(event.id, `Player ${i}`)));
  expect(tally(responses)).toEqual({ '201': 30, '409 EVENT_FULL': 20 });
  expect(await seats(event.id)).toEqual({ registeredCount: 30, rows: 30 });
});

it('admits one of 10 concurrent case and space variants of a name, without leaking an increment', async () => {
  const event = await insertEvent();
  const variants = ['Ada Lovelace', 'ada lovelace', 'ADA LOVELACE', '  Ada   Lovelace ', 'Ada\tLovelace',
    'Ａｄａ Ｌｏｖｅｌａｃｅ', 'aDa LoVeLaCe', 'Ada Lovelace', 'ADA  lovelace', 'ada LOVELACE'];
  const responses = await Promise.all(variants.map((name) => register(event.id, name)));
  expect(tally(responses)).toEqual({ '201': 1, '409 ALREADY_REGISTERED': 9 });
  expect(await seats(event.id)).toEqual({ registeredCount: 1, rows: 1 });
});

it('tells a returning player ALREADY_REGISTERED and a new one EVENT_FULL on a full event', async () => {
  const event = await insertEvent({ capacity: 4 });
  await Promise.all(['Ann', 'Bo', 'Cy', 'Di'].map((name) => register(event.id, name)));
  expect(outcome(await register(event.id, 'Ed'))).toBe('409 EVENT_FULL');
  expect(outcome(await register(event.id, ' ann '))).toBe('409 ALREADY_REGISTERED');
});

it.each([
  ['at', 0],
  ['after', 60_000],
])('closes registration %s startsAt', async (_, offset) => {
  const event = await insertEvent();
  lateNow = new Date(event.startsAt.getTime() + offset);
  const res = await late.post(`/api/events/${event.id}/registrations`).send({ name: 'Latecomer' });
  expect(outcome(res)).toBe('409 REGISTRATION_CLOSED');
});

it('rejects registeredCount above capacity in the database even when written as raw SQL', async () => {
  const event = await insertEvent({ capacity: 2 });
  await expect(
    db.$executeRaw`UPDATE "Event" SET "registeredCount" = 3 WHERE id = ${event.id}::uuid`,
  ).rejects.toThrow(/Event_registeredCount_check/);
});
