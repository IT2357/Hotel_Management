import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import useAuth from '../../hooks/useAuth';

export default function GuestDashboardPage() {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-700">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <button
            onClick={logout}
            className="px-6 py-2 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition duration-300 font-medium"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Book a Room", to: "/booking", description: "Find and book rooms." },
            { title: "Browse Rooms", to: "/rooms", description: "View all available rooms." },
            { title: "My Bookings", to: "/guest/my-bookings", description: "View and manage bookings." },
            { title: "Favorite Rooms", to: "/guest/favorites", description: "Browse your favorites." },
            { title: "My Reviews", to: "/guest/my-reviews", description: "Edit or delete reviews." },
            { title: "My Profile", to: "/profile", description: "Update your details." }
          ].map(({ title, description, to }) => (
            <DashboardCard key={title} title={title} description={description} to={to} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, to }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Link
        to={to}
        className="inline-block px-4 py-1 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 transition duration-300"
      >
        Go to {title}
      </Link>
    </div>
  );
}
