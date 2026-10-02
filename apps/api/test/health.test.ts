import { expect, it } from 'vitest';
import { api } from './helpers.ts';

const http = await api();

it('reports health after reaching the database', async () => {
  const res = await http.get('/api/health').expect(200);
  expect(res.body).toEqual({ ok: true });
});
