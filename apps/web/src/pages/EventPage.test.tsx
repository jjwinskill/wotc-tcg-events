import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { EVENT_ID, envelope, event, expectNoAxeViolations, renderAt } from '../test-utils';

const path = `/events/${EVENT_ID}`;
const notice = /Phones can't open localhost links/;

it('shows the QR code with its URL, the .ics link and the min-players hint', async () => {
  const { registrationUrl } = event();
  renderAt(path, () => [200, event()]);
  expect(await screen.findByRole('img', { name: 'QR code for the registration page' })).toBeTruthy();
  expect(screen.getByRole('link', { name: registrationUrl }).getAttribute('href')).toBe(registrationUrl);
  const ics = screen.getByRole('link', { name: 'Download calendar invite (.ics)' });
  expect([ics.getAttribute('href'), ics.hasAttribute('download')]).toEqual([`/api/events/${EVENT_ID}/invite.ics`, true]);
  expect(screen.getByText('Needs 3 more players to start')).toBeTruthy();
  expect(screen.queryByText(notice)).toBeNull();
  await expectNoAxeViolations();
});

it.each(['http://localhost:8080', 'http://127.0.0.1:5173'])('shows the phone notice when registrationUrl is %s', async (origin) => {
  renderAt(path, () => [200, event({ registrationUrl: `${origin}/events/${EVENT_ID}/register` })]);
  expect(await screen.findByText(notice)).toBeTruthy();
});

it('shows a not-found state for an unknown event', async () => {
  renderAt(path, () => [404, envelope('NOT_FOUND', 'Event not found')]);
  expect(await screen.findByRole('heading', { level: 1, name: 'Event not found' })).toBeTruthy();
  expect(document.title).toBe('Event not found · Game Night Events');
});
