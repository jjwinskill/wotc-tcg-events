import { DEFAULT_LOCATION, type EventDetail, type GameFormat, type GameTemplate } from '@app/shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, expect, vi } from 'vitest';
import { createQueryClient } from './queryClient';
import { routes } from './router';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

export const EVENT_ID = '7d3f5a52-1c2b-4e8a-9f00-2b6c1a7e9d11';

const format = (id: string, name: string, rules: Partial<GameFormat> = {}): GameFormat => ({
  id,
  name,
  durationMinutes: null,
  minPlayers: null,
  capacityStep: null,
  ...rules,
});
type Numbers = [defaultCapacity: number, minPlayers: number, maxCapacity: number, defaultDurationMinutes: number];
const game = (id: string, name: string, [defaultCapacity, minPlayers, maxCapacity, defaultDurationMinutes]: Numbers, formats: GameFormat[]): GameTemplate =>
  ({ id, name, defaultCapacity, minPlayers, maxCapacity, defaultDurationMinutes, formats });

export const templates = [
  game('mtg', 'Magic: The Gathering', [16, 4, 30, 180], [
    format('standard', 'Standard'),
    format('commander', 'Commander', { capacityStep: 4 }),
    format('booster-draft', 'Booster Draft', { durationMinutes: 240, minPlayers: 8 }),
  ]),
  game('pokemon', 'Pokémon TCG', [24, 4, 30, 150], [format('standard', 'Standard'), format('expanded', 'Expanded')]),
  game('one-piece', 'One Piece Card Game', [12, 6, 24, 120], [format('standard', 'Standard')]),
];

export const event = (overrides: Partial<EventDetail> = {}): EventDetail => ({
  id: EVENT_ID,
  name: 'Friday Night Draft',
  templateId: 'mtg',
  formatId: 'booster-draft',
  templateName: 'Magic: The Gathering',
  formatName: 'Booster Draft',
  startsAt: '2026-10-09T23:00:00.000Z',
  endsAt: '2026-10-10T03:00:00.000Z',
  durationMinutes: 240,
  capacity: 16,
  registeredCount: 5,
  minPlayers: 8,
  location: DEFAULT_LOCATION,
  registrationStatus: 'open',
  registrationUrl: `http://192.168.1.5:8080/events/${EVENT_ID}/register`,
  ...overrides,
});

export const envelope = (code: string, message: string, fieldErrors?: Record<string, string[]>) => ({
  error: { code, message, ...(fieldErrors && { details: { formErrors: [], fieldErrors } }) },
});

type Handler = (path: string, init?: RequestInit) => [status: number, body: unknown];

export function mockFetch(handler: Handler) {
  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    const [status, body] = handler(path, init);
    return Response.json(body, { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function renderAt(path: string, handler: Handler) {
  const fetchMock = mockFetch(handler);
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
    </QueryClientProvider>,
  );
  return fetchMock;
}

export const sentBody = (fetchMock: ReturnType<typeof mockFetch>): unknown =>
  JSON.parse(String(fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]?.body));

export async function expectNoAxeViolations() {
  // jsdom has no layout or paint, so contrast can't be measured here.
  const { violations } = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}
