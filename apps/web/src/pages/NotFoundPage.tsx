import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <>
      <title>Page not found · Game Night Events</title>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2">
        <Link to="/" className="underline">
          Back to the calendar
        </Link>
      </p>
    </>
  );
}
