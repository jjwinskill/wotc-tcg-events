import { PLAYER_NAME_MAX, Registration, type EventDetail } from '@app/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError, request } from '../api';
import { EventFacts, Field, IcsLink, Title, WithEvent, fieldProps, focusOnMount } from '../components';
import { eventQueries } from '../queries';

export function RegisterPage() {
  return <WithEvent>{(event) => <RegisterView key={event.id} event={event} />}</WithEvent>;
}

function RegisterView({ event }: { event: EventDetail }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (name: string) =>
      request(`/events/${event.id}/registrations`, Registration, { method: 'POST', body: JSON.stringify({ name }) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventQueries.all }),
  });
  const apiError = mutation.error instanceof ApiError ? mutation.error : undefined;
  // A lost race (full or closed on submit) shows the same state as loading the page in that state.
  const status =
    apiError?.code === 'EVENT_FULL' ? 'full' : apiError?.code === 'REGISTRATION_CLOSED' ? 'closed' : event.registrationStatus;
  const errors = apiError?.code === 'ALREADY_REGISTERED' ? { name: [apiError.message] } : (apiError?.fieldErrors ?? {});
  const formError = mutation.isError && !errors.name ? mutation.error.message : undefined;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(String(new FormData(e.currentTarget).get('name')));
  };

  return (
    <>
      <Title>{`Register · ${event.name}`}</Title>
      <h1 className="text-2xl font-bold">{`Register for ${event.name}`}</h1>
      <EventFacts event={event} />
      {mutation.isSuccess ? (
        <section className="space-y-2">
          <h2 tabIndex={-1} ref={focusOnMount} className="text-xl font-semibold">
            {`You're registered, ${mutation.data.name}`}
          </h2>
          <p>
            <IcsLink id={event.id} />
          </p>
        </section>
      ) : status !== 'open' ? (
        <section className="space-y-2">
          <h2 tabIndex={-1} ref={mutation.isError ? focusOnMount : undefined} className="text-xl font-semibold">
            {status === 'full' ? 'This event is full' : 'Registration closed'}
          </h2>
          <p>{status === 'full' ? 'Every seat is taken.' : 'Registration closed when the event started.'}</p>
          <Link to={`/events/${event.id}`} className="link">
            Back to the event
          </Link>
        </section>
      ) : (
        <form noValidate onSubmit={submit} className="max-w-sm space-y-4">
          <Field label="Your name" name="name" errors={errors}>
            <input {...fieldProps(errors, 'name')} required maxLength={PLAYER_NAME_MAX} autoComplete="name" />
          </Field>
          {formError && <p className="text-red-700">{formError}</p>}
          <button type="submit" className="btn" disabled={mutation.isPending}>
            {mutation.isPending ? 'Registering…' : 'Register'}
          </button>
        </form>
      )}
    </>
  );
}
