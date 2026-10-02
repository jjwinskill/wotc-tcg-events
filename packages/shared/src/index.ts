import { z } from 'zod';

export const DEFAULT_LOCATION = 'Main Street Games, 123 Main St';

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

export const CreateEventInput = z.object({
  name: z.string().trim().min(1, 'Enter an event name').max(100, 'Use 100 characters or fewer'),
  templateId: z.string().min(1, 'Choose a game'),
  formatId: z.string().min(1, 'Choose a format'),
  startsAt: instant.refine((s) => new Date(s).getTime() % (15 * 60_000) === 0, 'Pick a start time on a 15-minute step'),
  capacity: z
    .number({ error: 'Enter a whole number of players' })
    .int('Enter a whole number of players')
    .min(1, 'Capacity must be at least 1')
    .max(30, 'Capacity can be at most 30')
    .optional(),
  location: z.string().trim().min(1, 'Enter a location').max(200, 'Use 200 characters or fewer'),
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

export const RegisterInput = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(60, 'Use 60 characters or fewer'),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const Registration = z.object({ id: z.uuid(), name: z.string() });
export type Registration = z.infer<typeof Registration>;
