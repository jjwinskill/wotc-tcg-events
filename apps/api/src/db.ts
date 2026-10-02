import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

export type Db = PrismaClient;

export const createDb = (connectionString: string): Db =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 20 }) });
