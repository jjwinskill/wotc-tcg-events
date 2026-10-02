import { formatRules, type GameTemplate } from '@app/shared';
import { useState } from 'react';
import type { FieldErrors } from '../api';
import { Field, fieldProps } from './Field';

/** Format and capacity depend on the game; the parent remounts this with `key` when the game changes. */
export function GameFields({ template, errors }: { template: GameTemplate; errors: FieldErrors }) {
  const [formatId, setFormatId] = useState(template.formats[0]?.id ?? '');
  const rules = formatRules(template, formatId);
  return (
    <>
      <Field label="Format" name="formatId" errors={errors}>
        <select {...fieldProps(errors, 'formatId')} value={formatId} onChange={(e) => setFormatId(e.target.value)}>
          {template.formats.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Capacity" name="capacity" errors={errors}>
        <input
          type="number"
          {...fieldProps(errors, 'capacity')}
          required
          defaultValue={template.defaultCapacity}
          min={rules?.minCapacity}
          max={rules?.maxCapacity}
          step={rules?.step}
        />
      </Field>
    </>
  );
}
