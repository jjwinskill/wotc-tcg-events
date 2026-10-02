import { ErrorEnvelope, type ErrorCode } from '@app/shared';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors: Record<string, string[] | undefined> = {},
  ) {
    super(message);
  }
}

export async function request<S extends z.ZodType>(path: string, schema: S, init?: RequestInit): Promise<z.infer<S>> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const body: unknown = await res.json().catch(() => null);
  if (res.ok) return schema.parse(body);
  const parsed = ErrorEnvelope.safeParse(body);
  if (!parsed.success) throw new ApiError(res.status, 'INTERNAL', 'Something went wrong');
  const { code, message, details } = parsed.data.error;
  throw new ApiError(res.status, code, message, details?.fieldErrors);
}
