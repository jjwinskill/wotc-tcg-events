import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

// Client errors (404, 409…) are answers, not outages: show them at once instead of retrying.
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: (failures, error) => !(error instanceof ApiError && error.status < 500) && failures < 2 },
    },
  });
