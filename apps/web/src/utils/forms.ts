import { ApiError, type FieldErrors } from '../api';

export const fieldErrorsOf = (error: Error | null): FieldErrors => (error instanceof ApiError ? error.fieldErrors : {});

export const focusOnMount = (el: HTMLElement | null) => el?.focus();
