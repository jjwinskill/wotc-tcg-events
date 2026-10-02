import { DEFAULT_LOCATION } from '@app/shared';
import { fireEvent, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { envelope, event, expectNoAxeViolations, renderAt, sentBody, templates } from '../test-utils';

const renderCreate = (post: [number, unknown] = [201, event()]) =>
  renderAt('/events/new', (path, init) => (path === '/api/templates' ? [200, templates] : init?.method === 'POST' ? post : [200, event()]));

const capacityRules = () => {
  const input = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Capacity' });
  return { value: input.value, min: input.min, max: input.max, step: input.step };
};
const options = (name: string) => within(screen.getByRole('combobox', { name })).getAllByRole<HTMLOptionElement>('option');

it('picking a game sets its formats, default capacity and capacity bounds', async () => {
  renderCreate();
  await screen.findByRole('combobox', { name: 'Format' });
  expect(capacityRules()).toEqual({ value: '16', min: '4', max: '30', step: '1' });

  fireEvent.change(screen.getByRole('combobox', { name: 'Format' }), { target: { value: 'commander' } });
  expect(capacityRules()).toEqual({ value: '16', min: '4', max: '28', step: '4' });

  fireEvent.change(screen.getByRole('combobox', { name: 'Game' }), { target: { value: 'one-piece' } });
  expect(options('Format').map((o) => o.textContent)).toEqual(['Standard']);
  expect(capacityRules()).toEqual({ value: '12', min: '6', max: '24', step: '1' });
  await expectNoAxeViolations();
});

it.each([
  { case: '19:05 today', now: new Date(2026, 9, 1, 19, 5), date: '2026-10-01', firstSlot: '19:15', time: '19:15', startsAt: new Date(2026, 9, 1, 19, 15) },
  { case: '23:50 today', now: new Date(2026, 9, 1, 23, 50), date: '2026-10-02', firstSlot: '10:00', time: '18:00', startsAt: new Date(2026, 9, 2, 18) },
])('at $case it defaults to $date $time, hides past slots and sends ISO UTC', async ({ now, date, firstSlot, time, startsAt }) => {
  vi.useFakeTimers({ now, toFake: ['Date'] });
  const fetchMock = renderCreate();
  expect(await screen.findByRole('combobox', { name: 'Start time' })).toHaveProperty('value', time);
  expect(screen.getByLabelText('Date')).toHaveProperty('value', date);
  expect(options('Start time')[0]).toHaveProperty('value', firstSlot);

  fireEvent.change(screen.getByRole('textbox', { name: 'Event name' }), { target: { value: 'Friday Night Draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
  await screen.findByRole('heading', { level: 1, name: 'Friday Night Draft' });
  expect(sentBody(fetchMock)).toEqual({
    name: 'Friday Night Draft',
    templateId: 'mtg',
    formatId: 'standard',
    startsAt: startsAt.toISOString(),
    capacity: 16,
    location: DEFAULT_LOCATION,
  });
});

it('puts a server 400 field error on the field it names', async () => {
  const message = 'Pick a start time in the future';
  renderCreate([400, envelope('VALIDATION_FAILED', 'Check the form', { startsAt: [message] })]);
  fireEvent.click(await screen.findByRole('button', { name: 'Create event' }));
  const time = await screen.findByRole('combobox', { name: 'Start time', description: message });
  expect(time.getAttribute('aria-invalid')).toBe('true');
});
