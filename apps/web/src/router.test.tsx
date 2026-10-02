import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, it } from 'vitest';
import { routes } from './router';

it('renders the not-found page with its title for an unknown path', async () => {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/nope'] })} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
  expect(document.title).toBe('Page not found · Game Night Events');
});
