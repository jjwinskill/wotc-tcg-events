import { DEFAULT_LOCATION } from '@app/shared';
import { loadConfig } from './config.ts';
import { createDb } from './db.ts';
import { createEventService } from './events/service.ts';
import { templateDefinitions } from './templates/definitions.ts';
import { upsertTemplate } from './templates/store.ts';

const db = createDb(loadConfig().DATABASE_URL);
for (const def of templateDefinitions) await upsertTemplate(db, def);

// Demo events go only into an empty table, through the same create/register path as the API,
// so a re-seed never touches registeredCount and the full event's count equals its rows.
if ((await db.event.count()) === 0) {
  const events = createEventService({ db, clock: () => new Date() });
  const today = new Date();
  const at = (days: number) =>
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days, 23)).toISOString();
  const demo = [
    { days: 1, name: 'Modern Showdown', templateId: 'mtg', formatId: 'modern' },
    { days: 2, name: 'Commander Night', templateId: 'mtg', formatId: 'commander', capacity: 12 },
    { days: 4, name: 'Pokémon League Challenge', templateId: 'pokemon', formatId: 'standard' },
    {
      days: 6,
      name: 'One Piece Store Tournament',
      templateId: 'one-piece',
      formatId: 'standard',
      capacity: 6,
      players: ['Luffy', 'Zoro', 'Nami', 'Usopp', 'Sanji', 'Robin'],
    },
    { days: 9, name: 'Booster Draft Weekend', templateId: 'mtg', formatId: 'booster-draft', players: ['Chandra', 'Jace', 'Liliana'] },
    { days: 13, name: 'Expanded Cup', templateId: 'pokemon', formatId: 'expanded' },
  ];
  for (const { days, players = [], ...input } of demo) {
    const event = await events.create({ ...input, startsAt: at(days), location: DEFAULT_LOCATION });
    for (const name of players) await events.register(event.id, { name });
  }
}
await db.$disconnect();
console.log('seed complete');
