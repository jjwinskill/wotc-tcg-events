import type { ReactNode } from 'react';
import type { FieldErrors } from '../api';

export const fieldProps = (errors: FieldErrors, name: string) => ({
  id: name,
  name,
  className: 'input',
  'aria-invalid': errors[name] ? true : undefined,
  'aria-describedby': errors[name] ? `${name}-error` : undefined,
});

export function Field({ label, name, errors, children }: { label: string; name: string; errors: FieldErrors; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block font-medium">
        {label}
      </label>
      {children}
      {errors[name] && (
        <p id={`${name}-error`} className="text-sm text-red-700">
          {errors[name].join(' ')}
        </p>
      )}
    </div>
  );
}
