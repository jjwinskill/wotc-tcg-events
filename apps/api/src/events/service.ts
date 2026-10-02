import { createEvent as createIcs } from 'ics';
import { formatRules, isValidCapacity, type CreateEventInput, type EventRange } from '@app/shared';
import type { Clock } from '../app.ts';
import type { Db } from '../db.ts';
import { AppError, fieldError } from '../errors.ts';
import { findTemplate } from '../templates/store.ts';
import { endsAt, toDetail, toSummary } from './dto.ts';
import * as store from './store.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = () => new AppError(404, 'NOT_FOUND', 'Event not found');

const slug = (name: string) => name.toLowerCase().match(/[a-z0-9]+/g)?.join('-') ?? 'event';

export type EventService = ReturnType<typeof createEventService>;

export const createEventService = ({ db, clock }: { db: Db; clock: Clock }) => {
  const getRow = async (id: string) => {
    const row = UUID.test(id) ? await store.findEvent(db, id) : null;
    if (!row) throw notFound();
    return row;
  };

  return {
    async create(input: CreateEventInput, webOrigin: string) {
      const now = clock();
      if (new Date(input.startsAt) <= now) throw fieldError('startsAt', 'Pick a start time in the future');
      const template = await findTemplate(db, input.templateId);
      if (!template) throw fieldError('templateId', 'Choose a game from the list');
      const rules = formatRules(template, input.formatId);
      if (!rules) throw fieldError('formatId', `Choose a format offered for ${template.name}`);
      const capacity = input.capacity ?? template.defaultCapacity;
      if (!isValidCapacity(rules, capacity)) {
        const step = rules.step > 1 ? ` in steps of ${rules.step}` : '';
        throw fieldError('capacity', `Capacity must be ${rules.minCapacity}–${rules.maxCapacity}${step}`);
      }
      const row = await store.insertEvent(db, {
        name: input.name,
        templateId: template.id,
        formatId: input.formatId,
        startsAt: new Date(input.startsAt),
        durationMinutes: rules.durationMinutes,
        minPlayers: rules.minPlayers,
        capacity,
        location: input.location,
      });
      return toDetail(row, now, webOrigin);
    },

    async list(range: EventRange) {
      const now = clock();
      const rows = await store.eventsBetween(db, new Date(range.from), new Date(range.to));
      return rows.map((e) => toSummary(e, now));
    },

    get: async (id: string, webOrigin: string) => toDetail(await getRow(id), clock(), webOrigin),

    async invite(id: string) {
      const e = await getRow(id);
      const { error, value } = createIcs({
        uid: e.id,
        title: e.name,
        location: e.location,
        start: e.startsAt.getTime(),
        startInputType: 'utc',
        startOutputType: 'utc',
        end: endsAt(e).getTime(),
        endInputType: 'utc',
        endOutputType: 'utc',
      });
      if (!value) throw error ?? new Error('ics returned no calendar');
      return { filename: `${slug(e.name)}.ics`, ics: value };
    },
  };
};
