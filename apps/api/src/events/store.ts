import type { Prisma } from '../generated/prisma/client.ts';

type Client = Prisma.TransactionClient;

const withNames = { format: { select: { name: true, template: { select: { name: true } } } } } as const;
export type EventRow = Prisma.EventGetPayload<{ include: typeof withNames }>;

export const insertEvent = (db: Client, data: Prisma.EventUncheckedCreateInput) =>
  db.event.create({ data, include: withNames });

export const eventsBetween = (db: Client, from: Date, to: Date) =>
  db.event.findMany({ where: { startsAt: { gte: from, lt: to } }, orderBy: { startsAt: 'asc' }, include: withNames });

export const findEvent = (db: Client, id: string) => db.event.findUnique({ where: { id }, include: withNames });
