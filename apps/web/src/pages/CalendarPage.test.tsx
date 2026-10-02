import { screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { event, expectNoAxeViolations, renderAt } from '../test-utils';

it('requests the visible month and says "Full" in text on full events', async () => {
  vi.useFakeTimers({ now: new Date(2026, 9, 15, 12), toFake: ['Date'] });
  vi.stubGlobal('matchMedia', () => ({ matches: true })); // a phone-width screen starts in the list view
  const full = event({ id: '3c9e1f2a-4b5d-4e6f-8a7b-9c0d1e2f3a4b', name: 'Commander Night', registrationStatus: 'full' });
  const fetchMock = renderAt('/', () => [200, [event(), full]]);

  expect((await screen.findByRole('link', { name: 'Full · Commander Night' })).getAttribute('href')).toBe(`/events/${full.id}`);
  expect(screen.getByRole('link', { name: 'Friday Night Draft' })).toBeTruthy();
  const url = new URL(String(fetchMock.mock.calls[0]?.[0]), 'http://localhost');
  expect([url.pathname, url.searchParams.get('from'), url.searchParams.get('to')]).toEqual([
    '/api/events',
    new Date(2026, 9, 1).toISOString(),
    new Date(2026, 10, 1).toISOString(),
  ]);
  await expectNoAxeViolations();
});
