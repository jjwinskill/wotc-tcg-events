import type { EventDetail } from '@app/shared';

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
