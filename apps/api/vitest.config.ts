import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const envFile = resolve(import.meta.dirname, '../../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);
if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set (see .env.example)');

export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL },
  },
});
