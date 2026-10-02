import type { EventDetail } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api';
import { eventQueries } from '../queries';
import { Title } from './Title';

/** Loads the route's event and renders its loading, not-found and error states; children get the event. */
export function WithEvent({ children }: { children: (event: EventDetail) => ReactNode }) {
  const { id = '' } = useParams();
  const query = useQuery(eventQueries.detail(id));
  // Data first: a failed background refetch must not replace a loaded page or unmount the register confirmation.
  if (query.data) return children(query.data);
  if (query.isPending)
    return (
      <>
        <Title>Loading event</Title>
        <p>Loading event…</p>
      </>
    );
  const notFound = query.error instanceof ApiError && query.error.status === 404;
  return (
    <>
      <Title>{notFound ? 'Event not found' : 'Event unavailable'}</Title>
      <h1 className="text-2xl font-bold">{notFound ? 'Event not found' : "Couldn't load this event"}</h1>
      <p className="mt-2">
        {notFound ? (
          'This event does not exist. '
        ) : (
          <button type="button" className="link mr-2" onClick={() => query.refetch()}>
            Try again
          </button>
        )}
        <Link to="/" className="link">
          Back to the calendar
        </Link>
      </p>
    </>
  );
}
