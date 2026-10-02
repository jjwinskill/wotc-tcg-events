import { z } from 'zod';

export const DEFAULT_LOCATION = 'Main Street Games, 123 Main St';
export const EVENT_NAME_MAX = 100;
export const LOCATION_MAX = 200;
export const PLAYER_NAME_MAX = 60;

export const ErrorCode = z.enum([
  'VALIDATION_FAILED',
  'BAD_REQUEST',
  'NOT_FOUND',
  'ALREADY_REGISTERED',
  'REGISTRATION_CLOSED',
  'EVENT_FULL',
  'INTERNAL',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ErrorEnvelope = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z
      .object({
        formErrors: z.array(z.string()),
        fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
      })
      .optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>;

const instant = z.iso.datetime({ offset: true, error: 'Use an ISO date-time with a time zone offset' });
const body = <T extends z.ZodRawShape>(shape: T) => z.object(shape, { error: 'Send a JSON object body' });

export const GameFormat = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number().int().nullable(),
  minPlayers: z.number().int().nullable(),
  capacityStep: z.number().int().nullable(),
});
export type GameFormat = z.infer<typeof GameFormat>;

export const GameTemplate = z.object({
  id: z.string(),
  name: z.string(),
  defaultCapacity: z.number().int(),
  maxCapacity: z.number().int(),
  minPlayers: z.number().int(),
  defaultDurationMinutes: z.number().int(),
  formats: z.array(GameFormat),
});
export type GameTemplate = z.infer<typeof GameTemplate>;

/** The rules a format resolves to: its overrides, else the template's defaults. One source for API and form. */
export function formatRules(template: GameTemplate, formatId: string) {
  const format = template.formats.find((f) => f.id === formatId);
  if (!format) return undefined;
  const step = format.capacityStep ?? 1;
  const minPlayers = format.minPlayers ?? template.minPlayers;
  return {
    minPlayers,
    durationMinutes: format.durationMinutes ?? template.defaultDurationMinutes,
    step,
    minCapacity: Math.ceil(minPlayers / step) * step,
    maxCapacity: Math.floor(template.maxCapacity / step) * step,
  };
}
export type FormatRules = NonNullable<ReturnType<typeof formatRules>>;

export const isValidCapacity = (rules: FormatRules, capacity: number) =>
  capacity >= rules.minCapacity && capacity <= rules.maxCapacity && capacity % rules.step === 0;

export const CreateEventInput = body({
  name: z.string({ error: 'Enter an event name' }).trim().min(1, 'Enter an event name').max(EVENT_NAME_MAX, `Use ${EVENT_NAME_MAX} characters or fewer`),
  templateId: z.string({ error: 'Choose a game' }).min(1, 'Choose a game'),
  formatId: z.string({ error: 'Choose a format' }).min(1, 'Choose a format'),
  startsAt: instant.refine((s) => new Date(s).getTime() % (15 * 60_000) === 0, 'Pick a start time on a 15-minute step'),
  capacity: z
    .number({ error: 'Enter a whole number of players' })
    .int('Enter a whole number of players')
    .min(1, 'Capacity must be at least 1')
    .max(30, 'Capacity can be at most 30')
    .optional(),
  location: z.string({ error: 'Enter a location' }).trim().min(1, 'Enter a location').max(LOCATION_MAX, `Use ${LOCATION_MAX} characters or fewer`),
});
export type CreateEventInput = z.infer<typeof CreateEventInput>;

export const EventRange = z
  .object({ from: instant, to: instant })
  .refine((r) => new Date(r.from) < new Date(r.to), { error: '"from" must be before "to"', path: ['to'] });
export type EventRange = z.infer<typeof EventRange>;

export const RegistrationStatus = z.enum(['open', 'full', 'closed']);
export type RegistrationStatus = z.infer<typeof RegistrationStatus>;

export const EventSummary = z.object({
  id: z.uuid(),
  name: z.string(),
  templateName: z.string(),
  formatName: z.string(),
  startsAt: instant,
  endsAt: instant,
  capacity: z.number().int(),
  registeredCount: z.number().int(),
  registrationStatus: RegistrationStatus,
});
export type EventSummary = z.infer<typeof EventSummary>;

export const EventDetail = EventSummary.extend({
  templateId: z.string(),
  formatId: z.string(),
  location: z.string(),
  minPlayers: z.number().int(),
  durationMinutes: z.number().int(),
  registrationUrl: z.url(),
});
export type EventDetail = z.infer<typeof EventDetail>;

export const RegisterInput = body({
  name: z.string({ error: 'Enter your name' }).trim().min(1, 'Enter your name').max(PLAYER_NAME_MAX, `Use ${PLAYER_NAME_MAX} characters or fewer`),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const Registration = z.object({ id: z.uuid(), name: z.string() });
export type Registration = z.infer<typeof Registration>;
