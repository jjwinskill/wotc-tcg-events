import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createDb } from './db.ts';

const config = loadConfig();
const db = createDb(config.DATABASE_URL);
const app = createApp({ db, clock: () => new Date(), publicWebUrl: config.PUBLIC_WEB_URL });

const server = app.listen(config.PORT, (err?: Error) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`api listening on :${config.PORT}`);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => void db.$disconnect().finally(() => process.exit(0))));
}
