import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function ValdorGuestDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Floating Top Navigation */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full shadow hover:bg-white transition-colors"
          aria-label="Go to Home"
          title="Home"
        >
          <span>🏠</span>
          <span className="hidden sm:inline font-semibold">Home</span>
        </Link>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-full shadow hover:bg-amber-700 transition-colors"
          aria-label="Go to Menu"
          title="Menu"
        >
          <span>🍽️</span>
          <span className="hidden sm:inline font-semibold">Menu</span>
        </Link>
      </div>
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-orange-800/30 to-red-900/20"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        
        {/* Restaurant Image Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        />

        {/* Main Content */}
        <div className={`relative z-10 text-center px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Restaurant Logo/Name */}
          <div className="mb-8">
            <h1 className="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 mb-4 animate-pulse">
              VALDOR
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mb-4 animate-pulse"></div>
            <p className="text-xl md:text-2xl text-gray-700 font-light tracking-wide">
              Fine Dining Experience
            </p>
            <p className="text-lg text-gray-600 mt-2">
              Where Culinary Art Meets Excellence
            </p>
          </div>

          {/* Welcome Message */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-4">
              Welcome to Your Culinary Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience the finest cuisine crafted with passion, served with elegance, 
              and designed to create unforgettable memories.
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-amber-600 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-amber-600 rounded-full mt-2 animate-pulse"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Scroll to explore</p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Your Gateway to Excellence
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our comprehensive dining services designed to provide you with an exceptional experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "My Reservations",
                description: "View and manage your table reservations with ease",
                icon: "🏨",
                to: "/dashboard/my-bookings",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                title: "Favorite Dishes",
                description: "Browse and save your most loved culinary creations",
                icon: "❤️",
                to: "/dashboard/favorites",
                gradient: "from-red-500 to-red-600",
                bgGradient: "from-red-50 to-red-100"
              },
              {
                title: "Digital Menu",
                description: "Explore our exquisite menu with detailed descriptions",
                icon: "🍽️",
                to: "/menu",
                gradient: "from-amber-500 to-orange-600",
                bgGradient: "from-amber-50 to-orange-100"
              },
              {
                title: "Order History",
                description: "Track your culinary journey and reorder favorites",
                icon: "📋",
                to: "/dashboard/my-orders",
                gradient: "from-green-500 to-green-600",
                bgGradient: "from-green-50 to-green-100"
              },
              {
                title: "Reviews & Ratings",
                description: "Share your dining experience and read others' reviews",
                icon: "⭐",
                to: "/dashboard/reviews",
                gradient: "from-purple-500 to-purple-600",
                bgGradient: "from-purple-50 to-purple-100"
              },
              {
                title: "My Profile",
                description: "Manage your account and dining preferences",
                icon: "👤",
                to: "/profile",
                gradient: "from-indigo-500 to-indigo-600",
                bgGradient: "from-indigo-50 to-indigo-100"
              }
            ].map((service, index) => (
              <ServiceCard key={service.title} service={service} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Restaurant Showcase */}
      <div className="py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Experience VALDOR
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Step into a world where every detail is crafted to perfection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                title: "Elegant Ambiance",
                description: "Sophisticated dining atmosphere"
              },
              {
                image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                title: "Culinary Excellence",
                description: "Masterfully crafted dishes"
              },
              {
                image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                title: "Premium Service",
                description: "Exceptional hospitality"
              }
            ].map((item, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-300">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Discover our exquisite menu and make your reservation for an unforgettable dining experience
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              <span className="mr-2">🍽️</span>
              Explore Menu
            </Link>
            <Link
              to="/dashboard/my-bookings"
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white hover:text-orange-600 transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">📅</span>
              Make Reservation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service, index }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${service.bgGradient} opacity-50`}></div>
      
      {/* Card Content */}
      <div className="relative bg-white/90 backdrop-blur-sm p-8 h-full">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${service.gradient} text-white text-2xl mb-6 transform transition-transform duration-300 ${isHovered ? 'scale-110 rotate-12' : ''}`}>
          {service.icon}
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors">
          {service.title}
        </h3>
        <p className="text-gray-600 text-lg leading-relaxed mb-6">
          {service.description}
        </p>

        {/* Button */}
        <Link
          to={service.to}
          className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${service.gradient} text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
        >
          Explore
          <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-lg"></div>
      </div>
    </div>
  );
}
