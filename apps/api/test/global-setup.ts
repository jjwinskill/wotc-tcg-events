import { execFileSync } from 'node:child_process';
import pg from 'pg';

// Creates this worktree's test database if missing, migrates it with `migrate deploy`
// (never `db push`, which would skip the CHECK constraints), then empties it.
export default async function setup() {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  const dbName = url.pathname.slice(1);

  const admin = new pg.Client({ connectionString: Object.assign(new URL(url), { pathname: '/postgres' }).toString() });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'pipe',
  });

  const db = new pg.Client({ connectionString: url.toString() });
  await db.connect();
  await db.query('TRUNCATE "Registration", "Event", "GameFormat", "GameTemplate" CASCADE');
  await db.end();
}
