import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6">
        <Link to="/" className="text-lg font-semibold">
          Game Night Events
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
