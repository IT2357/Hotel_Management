import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import useAuth from '../../hooks/useAuth';
import { FiCalendar, FiStar, FiHome, FiHeart, FiEdit, FiUser, FiLogIn } from 'react-icons/fi';

export default function GuestDashboardPage() {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
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

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Booking */}
          <Link 
            to="/booking" 
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition flex flex-col"
          >
            <FiCalendar className="text-2xl mb-3 text-green-600" />
            <h3 className="font-bold text-lg">Book a Room</h3>
            <p className="text-sm text-gray-600 mt-1">Make a new reservation</p>
          </Link>

          {/* Current Requests Status */}
          <Link 
            to="/guest/my-requests" 
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition flex flex-col cursor-pointer"
          >
            <FiStar className="text-2xl mb-3 text-yellow-600" />
            <h3 className="font-bold text-lg">My Active Requests</h3>
            <p className="text-sm text-gray-600 mt-1">Track your service requests</p>
          </Link>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Check-in/Check-out", to: "/guest/check-in", description: "Self-service check-in/out.", icon: <FiLogIn /> },
            { title: "Browse Rooms", to: "/rooms", description: "View all available rooms.", icon: <FiHome /> },
            { title: "Order Food", to: "/food", description: "Browse and order from our menu.", icon: <FiStar className="text-orange-500" /> },
            { title: "My Bookings", to: "/guest/my-bookings", description: "View and manage bookings.", icon: <FiCalendar /> },
            { title: "Favorite Rooms", to: "/guest/favorites", description: "Browse your favorites.", icon: <FiHeart /> },
            { title: "My Reviews", to: "/guest/my-reviews", description: "Edit or delete reviews.", icon: <FiEdit /> },
            { title: "My Profile", to: "/profile", description: "Update your details.", icon: <FiUser /> }
          ].map(({ title, description, to, icon }) => (
            <DashboardCard key={title} title={title} description={description} to={to} icon={icon} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, to, icon }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition duration-300">
      <div className="flex items-center mb-3">
        <div className="text-indigo-600 mr-3">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
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