import { expect, it } from 'vitest';
import { api, createBody, insertEvent, outcome } from './helpers.ts';

const http = await api();
const configured = await api({ publicWebUrl: 'http://events.example.test:9000' });
const create = (over: object = {}) => http.post('/api/events').send(createBody(over));

it('applies template defaults and the Booster Draft duration, min-players and capacity overrides', async () => {
  const [standard, draft] = await Promise.all([create(), create({ formatId: 'booster-draft' })]);
  expect(standard.body).toMatchObject({ capacity: 16, durationMinutes: 180, minPlayers: 4 });
  expect(draft.body).toMatchObject({ capacity: 8, durationMinutes: 240, minPlayers: 8 });
});

it.each([
  ['standard', 4, '201'],
  ['standard', 30, '201'],
  ['standard', 3, '400 VALIDATION_FAILED capacity'],
  ['booster-draft', 8, '201'],
  ['booster-draft', 7, '400 VALIDATION_FAILED capacity'],
  ['commander', 28, '201'],
  ['commander', 10, '400 VALIDATION_FAILED capacity'],
])('mtg %s with capacity %i → %s', async (formatId, capacity, expected) => {
  expect(outcome(await create({ formatId, capacity }))).toBe(expected);
});

it('rejects a format from another game in the service and in the composite foreign key', async () => {
  expect(outcome(await create({ formatId: 'expanded' }))).toBe('400 VALIDATION_FAILED formatId');
  await expect(insertEvent({ formatId: 'expanded' })).rejects.toThrow(/Event_templateId_formatId_fkey/);
});

it.each([
  ['an unknown game', { templateId: 'chess' }, 'templateId'],
  ['capacity 31', { capacity: 31 }, 'capacity'],
  ['a past startsAt', { startsAt: '2020-01-03T18:00:00Z' }, 'startsAt'],
  ['a startsAt off the 15-minute grid', { startsAt: '2030-01-03T18:05:00Z' }, 'startsAt'],
  ['a blank name', { name: '   ' }, 'name'],
  ['a NUL byte in the name', { name: 'a\u0000b' }, 'name'],
  ['an invisible-only name', { name: '\u200B' }, 'name'],
  ['a startsAt with no offset', { startsAt: '2030-01-03T18:00:00' }, 'startsAt'],
])('rejects %s on that field', async (_, over, field) => {
  expect(outcome(await create(over))).toBe(`400 VALIDATION_FAILED ${field}`);
});

it('asks for a date and start time, alone, when startsAt is empty', async () => {
  expect((await create({ startsAt: '' })).body.error.details.fieldErrors.startsAt).toEqual(['Pick a date and start time']);
});

it.each([
  ['Pokémon League Challenge', 'pokemon-league-challenge.ics'],
  ['🎉 Draft Night 🃏', 'draft-night.ics'],
  ['🎉🃏', 'event.ics'],
])('serves a UTC invite for "%s" as %s', async (name, filename) => {
  const event = await insertEvent({ name, startsAt: new Date('2030-03-09T23:00:00Z'), durationMinutes: 240 });
  const res = await http.get(`/api/events/${event.id}/invite.ics`).expect(200);
  expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8');
  expect(res.headers['content-disposition']).toBe(`attachment; filename="${filename}"`);
  for (const line of ['DTSTART:20300309T230000Z', 'DTEND:20300310T030000Z', `SUMMARY:${name}`, 'LOCATION:Main Street Games', `UID:${event.id}`])
    expect(res.text).toContain(line);
});

it('lists events starting in [from, to) by start time, with endsAt and registrationStatus derived', async () => {
  const late = await insertEvent({ startsAt: new Date('2031-05-01T20:00:00Z'), capacity: 1, registeredCount: 1 });
  const early = await insertEvent({ startsAt: new Date('2031-05-01T18:00:00Z') });
  await insertEvent({ startsAt: new Date('2031-05-02T00:00:00Z') });
  const res = await http.get('/api/events').query({ from: '2031-05-01T00:00:00Z', to: '2031-05-02T00:00:00Z' });
  expect(res.body.map((e: { id: string; endsAt: string; registrationStatus: string }) => [e.id, e.endsAt, e.registrationStatus])).toEqual([
    [early.id, '2031-05-01T21:00:00.000Z', 'open'],
    [late.id, '2031-05-01T23:00:00.000Z', 'full'],
  ]);
});

it.each([
  ['the forwarded request origin', http, 'https://192.168.1.5:8080'],
  ['PUBLIC_WEB_URL when set', configured, 'http://events.example.test:9000'],
])('builds registrationUrl from %s', async (_, agent, origin) => {
  const event = await insertEvent();
  const res = await agent.get(`/api/events/${event.id}`).set('X-Forwarded-Proto', 'https').set('Host', '192.168.1.5:8080');
  expect(res.body.registrationUrl).toBe(`${origin}/events/${event.id}/register`);
});
