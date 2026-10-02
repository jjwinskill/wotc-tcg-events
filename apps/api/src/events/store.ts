import { Prisma } from '../generated/prisma/client.ts';
import type { Db } from '../db.ts';

type Client = Prisma.TransactionClient;

const withNames = { format: { select: { name: true, template: { select: { name: true } } } } } as const;
export type EventRow = Prisma.EventGetPayload<{ include: typeof withNames }>;

export const insertEvent = (db: Client, data: Prisma.EventUncheckedCreateInput) =>
  db.event.create({ data, include: withNames });

export const eventsBetween = (db: Client, from: Date, to: Date) =>
  db.event.findMany({ where: { startsAt: { gte: from, lt: to } }, orderBy: { startsAt: 'asc' }, include: withNames });

export const findEvent = (db: Client, id: string) => db.event.findUnique({ where: { id }, include: withNames });

// Concurrent registrations for one event queue for a pool connection and then for the event's row lock;
// maxWait/timeout bound that wait instead of failing fast.
export const inRegistrationTransaction = <T>(db: Db, fn: (tx: Client) => Promise<T>) =>
  db.$transaction(fn, { isolationLevel: 'ReadCommitted', maxWait: 20_000, timeout: 20_000 });

/** The guarded increment: under READ COMMITTED a blocked UPDATE re-checks its WHERE once the row lock is released. */
export const claimSeat = async (tx: Client, eventId: string, now: Date) => {
  const { count } = await tx.event.updateMany({
    where: { id: eventId, startsAt: { gt: now }, registeredCount: { lt: tx.event.fields.capacity } },
    data: { registeredCount: { increment: 1 } },
  });
  return count === 1;
};

export const insertRegistration = (tx: Client, eventId: string, name: string, nameKey: string) =>
  tx.registration.create({ data: { eventId, name, nameKey }, select: { id: true, name: true } });

export const seatFacts = (tx: Client, eventId: string, nameKey: string) =>
  tx.event.findUnique({
    where: { id: eventId },
    select: { startsAt: true, registrations: { where: { nameKey }, select: { id: true } } },
  });

export const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
