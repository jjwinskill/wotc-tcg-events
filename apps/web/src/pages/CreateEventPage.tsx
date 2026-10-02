import { useQuery } from '@tanstack/react-query';
import { CreateEventForm } from '../components/CreateEventForm';
import { Title } from '../components/Title';
import { templateQueries } from '../queries';

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
