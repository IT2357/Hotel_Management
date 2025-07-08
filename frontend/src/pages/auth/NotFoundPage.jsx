//src/pages/NotFound.jsx
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-extrabold text-gray-800">404</h1>
        <p className="text-lg text-gray-600">
          Page not found. The path you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
