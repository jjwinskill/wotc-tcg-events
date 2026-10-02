import { ErrorEnvelope } from '@app/shared';
import type { Test } from 'supertest';
import { expect, it } from 'vitest';
import { api, outcome } from './helpers.ts';

const http = await api();
const unknownIds = ['not-a-uuid', '00000000-0000-4000-8000-000000000000'];

it.each<[string, () => Test, string]>([
  ['malformed JSON', () => http.post('/api/events').type('json').send('{"name":'), '400 BAD_REQUEST'],
  ['a latin1 charset', () => http.post('/api/events').set('Content-Type', 'application/json; charset=latin1').send('{}'), '415 BAD_REQUEST'],
  ['an oversized body', () => http.post('/api/events').send({ name: 'x'.repeat(11_000) }), '413 BAD_REQUEST'],
  ['an unknown route', () => http.get('/api/nope'), '404 NOT_FOUND'],
  ...unknownIds.flatMap((id): [string, () => Test, string][] => [
    [`GET /events/${id}`, () => http.get(`/api/events/${id}`), '404 NOT_FOUND'],
    [`invite.ics for ${id}`, () => http.get(`/api/events/${id}/invite.ics`), '404 NOT_FOUND'],
  ]),
])('%s → %s in the error envelope', async (_, send, expected) => {
  const res = await send();
  expect(outcome(res)).toBe(expected);
  expect(ErrorEnvelope.safeParse(res.body).success).toBe(true);
});
