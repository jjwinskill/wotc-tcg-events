import { fireEvent, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { EVENT_ID, envelope, event, expectNoAxeViolations, renderAt } from '../test-utils';

const path = `/events/${EVENT_ID}/register`;

const submitName = async (response: [number, unknown]) => {
  renderAt(path, (_, init) => (init?.method === 'POST' ? response : [200, event()]));
  fireEvent.change(await screen.findByRole('textbox', { name: 'Your name' }), { target: { value: 'Ana' } });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
};

it.each([
  ['full', 'This event is full'],
  ['closed', 'Registration closed'],
] as const)('a %s event shows its state instead of the form', async (registrationStatus, heading) => {
  renderAt(path, () => [200, event({ registrationStatus })]);
  expect(await screen.findByRole('heading', { level: 2, name: heading })).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
});

it.each([
  ['a lost race (EVENT_FULL) shows the full state', [409, envelope('EVENT_FULL', 'This event is full')], 'This event is full'],
  ['success shows the confirmation', [201, { id: '0b8f3c1e-5a2d-4c6b-8e9f-1a2b3c4d5e6f', name: 'Ana' }], "You're registered, Ana"],
] as const)('submitting: %s', async (_, response, heading) => {
  await submitName([...response]);
  expect(await screen.findByRole('heading', { level: 2, name: heading })).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
});

it('ALREADY_REGISTERED shows an error on the name field', async () => {
  const message = 'Ana is already registered for this event';
  await submitName([409, envelope('ALREADY_REGISTERED', message)]);
  const name = await screen.findByRole('textbox', { name: 'Your name', description: message });
  expect(name.getAttribute('aria-invalid')).toBe('true');
  await expectNoAxeViolations();
});
