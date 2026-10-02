import type { RouteObject } from 'react-router';
import { Layout } from './Layout';
import { CalendarPage } from './pages/CalendarPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventPage } from './pages/EventPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: 'events/new', element: <CreateEventPage /> },
      { path: 'events/:id', element: <EventPage /> },
      { path: 'events/:id/register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
