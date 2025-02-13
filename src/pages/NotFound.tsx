import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Return Home
      </Link>
    </div>
  );
} 