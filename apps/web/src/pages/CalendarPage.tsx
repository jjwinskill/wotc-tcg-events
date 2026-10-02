import type { EventRange } from '@app/shared';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Title } from '../components';
import { eventQueries } from '../queries';

export function CalendarPage() {
  const [view, setView] = useState(() => (window.matchMedia('(max-width: 767px)').matches ? 'listMonth' : 'dayGridMonth'));
  const [range, setRange] = useState<EventRange>();
  const events = useQuery(eventQueries.list(range));

  return (
    <>
      <Title>Calendar</Title>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Link to="/events/new" className="btn">
          New event
        </Link>
      </div>
      <p className="mb-2 min-h-6">
        {events.isPending ? (
          'Loading events…'
        ) : events.isError ? (
          <>
            Couldn't load events.{' '}
            <button type="button" className="link" onClick={() => events.refetch()}>
              Try again
            </button>
          </>
        ) : (
          events.data.length === 0 && 'No events in this range.'
        )}
      </p>
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView={view}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }}
        buttonIcons={false}
        buttonText={{ prev: 'Previous', next: 'Next', today: 'Today', dayGridMonth: 'Month', listMonth: 'List' }}
        fixedWeekCount={false}
        nextDayThreshold="06:00"
        aspectRatio={1.5}
        // FullCalendar reads height from calendar-level options only, so a per-view height would collapse the list.
        height={view === 'listMonth' ? 'auto' : undefined}
        dayMaxEvents
        events={events.data?.map((e) => ({
          id: e.id,
          title: e.registrationStatus === 'full' ? `Full · ${e.name}` : e.name,
          start: e.startsAt,
          end: e.endsAt,
          url: `/events/${e.id}`,
        }))}
        datesSet={({ start, end, view: shown }) => {
          setView(shown.type);
          const next = { from: start.toISOString(), to: end.toISOString() };
          setRange((prev) => (prev?.from === next.from && prev.to === next.to ? prev : next));
        }}
      />
    </>
  );
}
