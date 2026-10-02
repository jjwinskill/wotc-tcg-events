import {
  DEFAULT_LOCATION,
  EVENT_NAME_MAX,
  EventDetail,
  LOCATION_MAX,
  formatRules,
  type CreateEventInput,
  type GameTemplate,
} from '@app/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { request, type FieldErrors } from '../api';
import { Field, Title, fieldErrorsOf, fieldProps } from '../components';
import { eventQueries, templateQueries } from '../queries';

const pad = (n: number) => String(n).padStart(2, '0');
// 15-minute start times from 10:00 to 23:45.
const SLOTS = Array.from({ length: 56 }, (_, i) => `${pad(10 + Math.floor(i / 4))}:${pad((i % 4) * 15)}`);
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const slotLabel = (time: string) => new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function CreateEventPage() {
  const templates = useQuery(templateQueries.list());
  return (
    <>
      <Title>New event</Title>
      <h1 className="mb-4 text-2xl font-bold">New event</h1>
      {templates.isPending ? (
        <p>Loading games…</p>
      ) : templates.isError ? (
        <p>
          Couldn't load the games.{' '}
          <button type="button" className="link" onClick={() => templates.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <CreateEventForm templates={templates.data} />
      )}
    </>
  );
}

function CreateEventForm({ templates }: { templates: GameTemplate[] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [now] = useState(() => new Date());
  const [templateId, setTemplateId] = useState(templates[0]?.id);
  const [pickedDate, setDate] = useState<string>();
  const [pickedTime, setTime] = useState<string>();
  const mutation = useMutation({
    mutationFn: (input: CreateEventInput) => request('/events', EventDetail, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (event) => {
      void queryClient.invalidateQueries({ queryKey: eventQueries.all });
      void navigate(`/events/${event.id}`);
    },
  });

  const slotsOn = (date: string) => SLOTS.filter((time) => new Date(`${date}T${time}`) > now);
  const today = localDate(now);
  const firstDate = slotsOn(today).length ? today : localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const date = pickedDate || firstDate;
  const slots = slotsOn(date);
  const time = pickedTime && slots.includes(pickedTime) ? pickedTime : (slots.find((t) => t >= '18:00') ?? slots[0]);
  const template = templates.find((t) => t.id === templateId);
  const errors = fieldErrorsOf(mutation.error);
  const formError = mutation.isError && Object.keys(errors).length === 0 ? mutation.error.message : undefined;

  if (!template) return <p>No games are set up yet.</p>;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      name: String(form.get('name')),
      templateId: template.id,
      formatId: String(form.get('formatId')),
      startsAt: time ? new Date(`${date}T${time}`).toISOString() : '',
      capacity: Number(form.get('capacity')),
      location: String(form.get('location')),
    });
  };

  return (
    <form noValidate onSubmit={submit} className="max-w-lg space-y-4">
      <Field label="Event name" name="name" errors={errors}>
        <input {...fieldProps(errors, 'name')} required maxLength={EVENT_NAME_MAX} />
      </Field>
      <Field label="Game" name="templateId" errors={errors}>
        <select
          {...fieldProps(errors, 'templateId')}
          value={template.id}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <GameFields key={template.id} template={template} errors={errors} />
      <fieldset>
        <legend className="mb-1 font-medium">Start</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="date" className="block font-medium">
              Date
            </label>
            <input type="date" id="date" className="input" required min={firstDate} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Field label="Start time" name="startsAt" errors={errors}>
            <select {...fieldProps(errors, 'startsAt')} required value={time ?? ''} onChange={(e) => setTime(e.target.value)}>
              {slots.length === 0 && <option value="">No start times left on this date</option>}
              {slots.map((t) => (
                <option key={t} value={t}>
                  {slotLabel(t)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>
      <Field label="Location" name="location" errors={errors}>
        <input {...fieldProps(errors, 'location')} required maxLength={LOCATION_MAX} defaultValue={DEFAULT_LOCATION} />
      </Field>
      {formError && <p className="text-red-700">{formError}</p>}
      <button type="submit" className="btn" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating…' : 'Create event'}
      </button>
    </form>
  );
}

/** Format and capacity depend on the game; the parent remounts this with `key` when the game changes. */
function GameFields({ template, errors }: { template: GameTemplate; errors: FieldErrors }) {
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
