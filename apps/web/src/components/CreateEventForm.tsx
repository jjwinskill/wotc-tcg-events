import { DEFAULT_LOCATION, EVENT_NAME_MAX, EventDetail, LOCATION_MAX, type CreateEventInput, type GameTemplate } from '@app/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { request } from '../api';
import { eventQueries } from '../queries';
import { fieldErrorsOf } from '../utils/forms';
import { chosenSlot, firstOpenDate, slotLabel, slotsOn, toIsoUtc } from '../utils/timeSlots';
import { Field, fieldProps } from './Field';
import { GameFields } from './GameFields';

export function CreateEventForm({ templates }: { templates: GameTemplate[] }) {
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

  const firstDate = firstOpenDate(now);
  const date = pickedDate || firstDate;
  const slots = slotsOn(date, now);
  const time = chosenSlot(slots, pickedTime);
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
      startsAt: toIsoUtc(date, time),
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
        <select {...fieldProps(errors, 'templateId')} value={template.id} onChange={(e) => setTemplateId(e.target.value)}>
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
