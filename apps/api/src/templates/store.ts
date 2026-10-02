import { formatRules, isValidCapacity, type GameTemplate } from '@app/shared';
import type { Db } from '../db.ts';
import type { TemplateDefinition } from './definitions.ts';

const withFormats = {
  formats: {
    select: { id: true, name: true, durationMinutes: true, minPlayers: true, capacityStep: true },
    orderBy: { name: 'asc' },
  },
} as const;

export const listTemplates = (db: Db): Promise<GameTemplate[]> =>
  db.gameTemplate.findMany({ include: withFormats, orderBy: { name: 'asc' } });

export const findTemplate = (db: Db, id: string): Promise<GameTemplate | null> =>
  db.gameTemplate.findUnique({ where: { id }, include: withFormats });

/** Seeds one game. Rejects a default capacity that some format could never accept, so a bad game fails here, not on a form. */
export async function upsertTemplate(db: Db, def: TemplateDefinition) {
  const { formats: defFormats, ...row } = def;
  const formats = defFormats.map((f) => ({ durationMinutes: null, minPlayers: null, capacityStep: null, ...f }));
  for (const f of formats) {
    const rules = formatRules({ ...row, formats }, f.id)!;
    if (!isValidCapacity(rules, row.defaultCapacity))
      throw new Error(
        `Template ${row.id}/${f.id}: defaultCapacity ${row.defaultCapacity} must be a multiple of ${rules.step} between ${rules.minCapacity} and ${rules.maxCapacity}`,
      );
  }
  await db.$transaction([
    db.gameTemplate.upsert({ where: { id: row.id }, create: row, update: row }),
    ...formats.map((f) =>
      db.gameFormat.upsert({
        where: { templateId_id: { templateId: row.id, id: f.id } },
        create: { ...f, templateId: row.id },
        update: f,
      }),
    ),
  ]);
}
