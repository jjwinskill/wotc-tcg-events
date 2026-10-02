import type { EventDetail } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError, type FieldErrors } from './api';
import { eventQueries } from './queries';

export const Title = ({ children }: { children: string }) => <title>{`${children} · Game Night Events`}</title>;

export const focusOnMount = (el: HTMLElement | null) => el?.focus();

export const fieldErrorsOf = (error: Error | null): FieldErrors => (error instanceof ApiError ? error.fieldErrors : {});

export const fieldProps = (errors: FieldErrors, name: string) => ({
  id: name,
  name,
  className: 'input',
  'aria-invalid': errors[name] ? true : undefined,
  'aria-describedby': errors[name] ? `${name}-error` : undefined,
});

export function Field({ label, name, errors, children }: { label: string; name: string; errors: FieldErrors; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block font-medium">
        {label}
      </label>
      {children}
      {errors[name] && (
        <p id={`${name}-error`} className="text-sm text-red-700">
          {errors[name].join(' ')}
        </p>
      )}
    </div>
  );
}

export const IcsLink = ({ id }: { id: string }) => (
  <a href={`/api/events/${id}/invite.ics`} download className="link">
    Download calendar invite (.ics)
  </a>
);

const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' });

export function EventFacts({ event }: { event: EventDetail }) {
  const { registeredCount: n, capacity } = event;
  const facts = {
    Game: `${event.templateName} · ${event.formatName}`,
    When: when.formatRange(new Date(event.startsAt), new Date(event.endsAt)),
    Where: event.location,
    Players: event.registrationStatus === 'full' ? `Full · ${n}/${capacity}` : `${n}/${capacity} registered`,
  };
  return (
    <dl className="my-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      {Object.entries(facts).map(([term, value]) => [
        <dt key={term} className="font-medium">
          {term}
        </dt>,
        <dd key={`${term}-value`}>{value}</dd>,
      ])}
    </dl>
  );
}

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
