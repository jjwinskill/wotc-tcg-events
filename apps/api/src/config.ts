import { z } from 'zod';

const Env = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().default(3000),
  PUBLIC_WEB_URL: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.url({ protocol: /^https?$/ }).transform((u) => new URL(u).origin).optional(),
  ),
});

export type Config = z.infer<typeof Env>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => Env.parse(env);
