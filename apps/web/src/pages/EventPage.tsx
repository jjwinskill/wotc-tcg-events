import type { EventDetail } from '@app/shared';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router';
import { EventFacts, IcsLink, Title, WithEvent } from '../components';

export function EventPage() {
  return <WithEvent>{(event) => <EventView event={event} />}</WithEvent>;
}

function EventView({ event }: { event: EventDetail }) {
  const needed = event.minPlayers - event.registeredCount;
  const url = event.registrationUrl;
  const localOnly = ['localhost', '127.0.0.1'].includes(new URL(url).hostname);
  return (
    <>
      <Title>{event.name}</Title>
      <h1 className="text-2xl font-bold">{event.name}</h1>
      <EventFacts event={event} />
      {event.registrationStatus === 'open' && needed > 0 && <p>{`Needs ${needed} more player${needed === 1 ? '' : 's'} to start`}</p>}
      <p className="my-4">
        <IcsLink id={event.id} />
      </p>
      {event.registrationStatus === 'open' ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Registration</h2>
          <Link to={`/events/${event.id}/register`} className="btn">
            Register for this event
          </Link>
          <QRCodeSVG value={url} title="QR code for the registration page" role="img" size={192} marginSize={2} />
          <p>
            Or share this link:{' '}
            <a href={url} className="link break-all">
              {url}
            </a>
          </p>
          {localOnly && (
            <p className="text-sm">Phones can't open localhost links; see "Scan from a phone" in the README.</p>
          )}
        </section>
      ) : (
        <p className="text-lg font-semibold">{event.registrationStatus === 'full' ? 'This event is full' : 'Registration closed'}</p>
      )}
    </>
  );
}
