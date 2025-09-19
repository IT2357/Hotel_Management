import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import useAuth from '../../hooks/useAuth';

export default function GuestDashboardPage() {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Your personalized hotel experience awaits
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">Premium Service</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">Luxury Rooms</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">🏨</div>
            <div className="text-2xl font-bold text-gray-800">Premium</div>
            <div className="text-gray-600">Hotel Experience</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-gray-800">4.9/5</div>
            <div className="text-gray-600">Guest Rating</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">🌟</div>
            <div className="text-2xl font-bold text-gray-800">Luxury</div>
            <div className="text-gray-600">Accommodations</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {[
            {
              title: "My Bookings",
              to: "/dashboard/my-bookings",
              description: "View and manage your reservations",
              icon: "📅",
              color: "from-blue-500 to-blue-600",
              bgColor: "bg-blue-50"
            },
            {
              title: "Favorite Rooms",
              to: "/dashboard/favorites",
              description: "Browse your saved room preferences",
              icon: "❤️",
              color: "from-pink-500 to-rose-500",
              bgColor: "bg-pink-50"
            },
            {
              title: "My Reviews",
              to: "/dashboard/reviews",
              description: "Share your experience and feedback",
              icon: "⭐",
              color: "from-yellow-500 to-orange-500",
              bgColor: "bg-yellow-50"
            },
            {
              title: "My Profile",
              to: "/profile",
              description: "Update your personal information",
              icon: "👤",
              color: "from-green-500 to-emerald-500",
              bgColor: "bg-green-50"
            }
          ].map(({ title, description, to, icon, color, bgColor }) => (
            <DashboardCard
              key={title}
              title={title}
              description={description}
              to={to}
              icon={icon}
              color={color}
              bgColor={bgColor}
            />
          ))}
        </div>

        {/* Logout Button */}
        <div className="text-center mt-12">
          <button
            onClick={logout}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, to, icon, color, bgColor }) {
  return (
    <Link to={to} className="group block">
      <div className={`${bgColor} rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-100`}>
        <div className="flex items-center mb-4">
          <div className="text-4xl mr-4">{icon}</div>
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color} flex items-center justify-center shadow-md`}>
            <span className="text-white text-xl">→</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-gray-900">{title}</h2>
        <p className="text-gray-600 text-base leading-relaxed mb-6">{description}</p>
        <div className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${color} text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300`}>
          <span>Explore</span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
