import type { GameFormat, GameTemplate } from '@app/shared';

export type TemplateDefinition = Omit<GameTemplate, 'formats'> & {
  formats: (Pick<GameFormat, 'id' | 'name'> & Partial<Omit<GameFormat, 'id' | 'name'>>)[];
};

// The seed for the GameTemplate/GameFormat rows. Adding a game means appending one entry here.
export const templateDefinitions: TemplateDefinition[] = [
  {
    id: 'mtg',
    name: 'Magic: The Gathering',
    defaultCapacity: 16,
    maxCapacity: 30,
    minPlayers: 4,
    defaultDurationMinutes: 180,
    formats: [
      { id: 'standard', name: 'Standard' },
      { id: 'modern', name: 'Modern', defaultCapacity: 12 },
      { id: 'commander', name: 'Commander', capacityStep: 4, defaultCapacity: 12 },
      { id: 'booster-draft', name: 'Booster Draft', durationMinutes: 240, minPlayers: 8, defaultCapacity: 8 },
    ],
  },
  {
    id: 'pokemon',
    name: 'Pokémon TCG',
    defaultCapacity: 24,
    maxCapacity: 30,
    minPlayers: 4,
    defaultDurationMinutes: 150,
    formats: [
      { id: 'standard', name: 'Standard' },
      { id: 'expanded', name: 'Expanded', defaultCapacity: 16 },
    ],
  },
  {
    id: 'one-piece',
    name: 'One Piece Card Game',
    defaultCapacity: 12,
    maxCapacity: 24,
    minPlayers: 6,
    defaultDurationMinutes: 120,
    formats: [{ id: 'standard', name: 'Standard' }],
  },
];
