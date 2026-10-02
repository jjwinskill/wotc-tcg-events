import type { EventDetail, EventSummary } from '@app/shared';
import type { EventRow } from './store.ts';

export const endsAt = (e: EventRow) => new Date(e.startsAt.getTime() + e.durationMinutes * 60_000);

export const toSummary = (e: EventRow, now: Date): EventSummary => ({
  id: e.id,
  name: e.name,
  templateName: e.format.template.name,
  formatName: e.format.name,
  startsAt: e.startsAt.toISOString(),
  endsAt: endsAt(e).toISOString(),
  capacity: e.capacity,
  registeredCount: e.registeredCount,
  registrationStatus: e.startsAt <= now ? 'closed' : e.registeredCount >= e.capacity ? 'full' : 'open',
});

export const toDetail = (e: EventRow, now: Date): Omit<EventDetail, 'registrationUrl'> => ({
  ...toSummary(e, now),
  templateId: e.templateId,
  formatId: e.formatId,
  location: e.location,
  minPlayers: e.minPlayers,
  durationMinutes: e.durationMinutes,
});
