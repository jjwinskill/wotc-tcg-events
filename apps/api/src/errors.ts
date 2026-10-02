import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z, ZodError } from 'zod';
import type { ErrorCode, ErrorEnvelope } from '@app/shared';

type Details = NonNullable<ErrorEnvelope['error']['details']>;

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: Details,
  ) {
    super(message);
  }
}

export const fieldError = (field: string, message: string) =>
  new AppError(400, 'VALIDATION_FAILED', message, { formErrors: [], fieldErrors: { [field]: [message] } });

const envelope = (code: ErrorCode, message: string, details?: Details): ErrorEnvelope => ({
  error: { code, message, ...(details && { details }) },
});

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(envelope('NOT_FOUND', 'Not found'));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json(envelope(err.code, err.message, err.details));
  if (err instanceof ZodError) {
    const { formErrors, fieldErrors } = z.flattenError(err);
    const message = formErrors[0] ?? Object.values(fieldErrors).flat()[0] ?? 'Invalid input';
    return res.status(400).json(envelope('VALIDATION_FAILED', String(message), { formErrors, fieldErrors }));
  }
  const status = err?.status ?? err?.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500 && err.expose)
    return res.status(status).json(envelope('BAD_REQUEST', err.message));
  console.error(err);
  return res.status(500).json(envelope('INTERNAL', 'Something went wrong'));
};
