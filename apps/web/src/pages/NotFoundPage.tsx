import { Link } from 'react-router';
import { Title } from '../components';

export function NotFoundPage() {
  return (
    <>
      <Title>Page not found</Title>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2">
        <Link to="/" className="underline">
          Back to the calendar
        </Link>
      </p>
    </>
  );
}
