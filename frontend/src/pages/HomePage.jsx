import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-4">
          Welcome to the Hotel Management App 🏨
        </h1>
        <p className="text-gray-700 text-lg mb-8">
          Manage bookings, rooms, and users with ease. Build something awesome here!
        </p>
        
        <div className="flex justify-center gap-6">
          <Link
            to="/login"
            className="px-6 py-2 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 transition duration-300 font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-full shadow hover:bg-indigo-50 transition duration-300 font-medium"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
