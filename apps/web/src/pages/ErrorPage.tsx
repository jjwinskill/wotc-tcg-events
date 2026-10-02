import { Link } from 'react-router';
import { Title } from '../components';

export function ErrorPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Title>Something went wrong</Title>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2">
        <Link to="/" className="underline">
          Back to the calendar
        </Link>
      </p>
    </main>
  );
}
