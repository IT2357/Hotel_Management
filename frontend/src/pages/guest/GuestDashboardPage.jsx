// 📁 frontend/pages/guest/GuestDashboardPage.jsx
import { Link } from "react-router-dom";

const GuestDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tamil-cream via-tamil-brown/20 to-tamil-red/10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tamil-red via-tamil-brown to-tamil-maroon text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              வணக்கம், Guest! 👋
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Your authentic Jaffna hospitality experience awaits
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-tamil-gold/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">Authentic Tamil Cuisine</span>
              </div>
              <div className="bg-tamil-gold/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">Traditional Hospitality</span>
              </div>
              <div className="bg-tamil-gold/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-semibold">Sri Lankan Warmth</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-tamil-brown/90 backdrop-blur-sm border-b border-tamil-gold/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-tamil-cream hover:text-tamil-gold font-medium transition-colors">
                Home
              </Link>
              <Link to="/menu" className="text-tamil-cream hover:text-tamil-gold font-medium transition-colors">
                Menu
              </Link>
              <Link to="/food-ordering" className="text-tamil-cream hover:text-tamil-gold font-medium transition-colors">
                Order Food
              </Link>
              <Link to="/rooms" className="text-tamil-cream hover:text-tamil-gold font-medium transition-colors">
                Rooms
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="text-tamil-cream hover:text-tamil-gold font-medium transition-colors">
                Profile
              </Link>
              <button
                onClick={() => {}}
                className="bg-tamil-red hover:bg-tamil-red/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-tamil-cream rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300 border border-tamil-gold/20">
            <div className="text-3xl mb-2">🏨</div>
            <div className="text-2xl font-bold text-tamil-brown">Authentic</div>
            <div className="text-tamil-brown/70">Jaffna Experience</div>
          </div>
          <div className="bg-tamil-cream rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300 border border-tamil-gold/20">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-tamil-brown">4.9/5</div>
            <div className="text-tamil-brown/70">Guest Rating</div>
          </div>
          <div className="bg-tamil-cream rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300 border border-tamil-gold/20">
            <div className="text-3xl mb-2">🌟</div>
            <div className="text-2xl font-bold text-tamil-brown">Traditional</div>
            <div className="text-tamil-brown/70">Hospitality</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Jaffna Menu",
              to: "/menu",
              description: "Explore authentic Tamil cuisine and traditional dishes",
              icon: "🍛",
              color: "from-tamil-red to-tamil-orange",
              bgColor: "bg-tamil-red/10"
            },
            {
              title: "My Food Orders",
              to: "/dashboard/my-orders",
              description: "Track your food orders and order history",
              icon: "🛍️",
              color: "from-tamil-green to-tamil-brown",
              bgColor: "bg-tamil-green/10"
            },
            {
              title: "My Bookings",
              to: "/dashboard/my-bookings",
              description: "View and manage your room reservations",
              icon: "🏨",
              color: "from-tamil-gold to-tamil-orange",
              bgColor: "bg-tamil-gold/10"
            },
            {
              title: "Favorite Rooms",
              to: "/dashboard/favorites",
              description: "Browse your saved room preferences",
              icon: "❤️",
              color: "from-tamil-maroon to-tamil-red",
              bgColor: "bg-tamil-maroon/10"
            },
            {
              title: "My Reviews",
              to: "/dashboard/reviews",
              description: "Share your experience and feedback",
              icon: "⭐",
              color: "from-tamil-saffron to-tamil-gold",
              bgColor: "bg-tamil-saffron/10"
            },
            {
              title: "My Profile",
              to: "/profile",
              description: "Update your personal information",
              icon: "👤",
              color: "from-tamil-brown to-tamil-maroon",
              bgColor: "bg-tamil-brown/10"
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
            onClick={() => {}}
            className="px-8 py-3 bg-gradient-to-r from-tamil-red to-tamil-maroon text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
          >
            வெளியேறு (Logout)
          </button>
        </div>
      </div>
    </div>
  );
};

function DashboardCard({ title, description, to, icon, color, bgColor }) {
  return (
    <Link to={to} className="group block">
      <div className={`${bgColor} rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-tamil-gold/20`}>
        <div className="flex items-center mb-4">
          <div className="text-4xl mr-4">{icon}</div>
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color} flex items-center justify-center shadow-md`}>
            <span className="text-white text-xl">→</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-tamil-brown mb-3 group-hover:text-tamil-red">{title}</h2>
        <p className="text-tamil-brown/70 text-base leading-relaxed mb-6">{description}</p>
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

export default GuestDashboardPage;
