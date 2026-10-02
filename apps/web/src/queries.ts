import { EventDetail, EventSummary, GameTemplate, type EventRange } from '@app/shared';
import { queryOptions, skipToken } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './api';

export const templateQueries = {
  list: () =>
    queryOptions({ queryKey: ['templates'], queryFn: () => request('/templates', z.array(GameTemplate)), staleTime: Infinity }),
};

export const eventQueries = {
  all: ['events'] as const,
  list: (range: EventRange | undefined) =>
    queryOptions({
      queryKey: ['events', 'list', range],
      queryFn: range ? () => request(`/events?${new URLSearchParams(range)}`, z.array(EventSummary)) : skipToken,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ['events', 'detail', id],
      queryFn: () => request(`/events/${encodeURIComponent(id)}`, EventDetail),
    }),
};
