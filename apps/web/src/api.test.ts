import { Registration } from '@app/shared';
import { expect, it } from 'vitest';
import { request } from './api';
import { envelope, mockFetch } from './test-utils';

const registration = { id: '0b8f3c1e-5a2d-4c6b-8e9f-1a2b3c4d5e6f', name: 'Ana' };

it('parses a success body with the shared schema', async () => {
  mockFetch(() => [201, { ...registration, extra: true }]);
  await expect(request('/events/x/registrations', Registration)).resolves.toEqual(registration);
});

it.each([
  [400, envelope('VALIDATION_FAILED', 'Check the form', { name: ['Enter your name'] }), { code: 'VALIDATION_FAILED', fieldErrors: { name: ['Enter your name'] } }],
  [409, envelope('EVENT_FULL', 'This event is full'), { code: 'EVENT_FULL', message: 'This event is full' }],
  [502, '<html>Bad gateway</html>', { code: 'INTERNAL', message: 'Something went wrong' }],
])('maps a %i response to an ApiError', async (status, body, expected) => {
  mockFetch(() => [status, body]);
  await expect(request('/events', Registration)).rejects.toMatchObject({ status, ...expected });
});
