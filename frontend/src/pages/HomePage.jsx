import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Info, Image, Phone, ChefHat, ShoppingCart, Bed, Calendar, Menu, X, User, Heart, FileText, MessageSquare, Star, CheckCircle, Clock, MapPin, LogIn, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import foodService from '../services/foodService';
import roomService from '../services/roomService';

export default function HomePage() {
  const { user, logout } = useContext(AuthContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const navigate = useNavigate();

  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', // Luxury hotel room
      title: 'Luxury Accommodations',
      subtitle: 'Your Perfect Stay Awaits',
      description: 'Experience comfort and elegance in our beautifully designed rooms and suites'
    },
    {
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200', // Hotel exterior
      title: 'Welcome to Paradise',
      subtitle: 'Premium Hotel Experience',
      description: 'Discover exceptional hospitality and world-class amenities at our hotel'
    },
    {
      image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200', // Modern hotel room
      title: 'Modern Comfort',
      subtitle: 'Spacious & Stylish Rooms',
      description: 'Relax in our contemporary rooms featuring premium furnishings and stunning views'
    },
    {
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200', // Jaffna food spread
      title: 'Authentic Jaffna Tamil Cuisine',
      subtitle: 'VALDOR - Heart of Jaffna Flavors',
      description: 'Experience the rich culinary heritage of Jaffna Tamil traditions at VALDOR'
    },
    {
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200', // Seafood curry
      title: 'Fresh Seafood Delicacies',
      subtitle: 'Caught Daily from Jaffna Waters',
      description: 'Savor the freshest seafood prepared with traditional Jaffna methods at VALDOR'
    }
  ];

  const jaffnaSpecialties = [
    {
      name: 'Jaffna Crab Curry',
      tamil: 'யாழ் நண்டு கறி',
      description: 'Fresh crab from Jaffna lagoon cooked in traditional spices',
      price: 'LKR 2,250',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      spice: '🌶️🌶️🌶️'
    },
    {
      name: 'Kachal Rice Meal',
      tamil: 'கச்சல் சோறு',
      description: 'Fragrant rice with mixed vegetables and Jaffna spices',
      price: 'LKR 1,850',
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400',
      spice: '🌶️🌶️'
    },
    {
      name: 'Mutton Varuval',
      tamil: 'மட்டன் வருவல்',
      description: 'Tender mutton marinated in Jaffna masala and grilled',
      price: 'LKR 2,150',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      spice: '🌶️🌶️🌶️🌶️'
    },
    {
      name: 'Fish Ambul Thiyal',
      tamil: 'மீன் அம்புள் தியல்',
      description: 'Sour fish curry with goraka and Jaffna coastal spices',
      price: 'LKR 1,950',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
      spice: '🌶️🌶️🌶️'
    },
    {
      name: 'Pani Walalu',
      tamil: 'பனி வலலு',
      description: 'Traditional Jaffna sweet made with rice flour and honey',
      price: 'LKR 650',
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
      spice: '🍯'
    },
    {
      name: 'Jaffna Mango Curry',
      tamil: 'யாழ் மாங்காய் கறி',
      description: 'Seasonal mango curry with coconut milk and Jaffna spices',
      price: 'LKR 1,450',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
      spice: '🌶️🌶️'
    }
  ];

  const testimonials = [
    {
      text: "VALDOR serves the most authentic Jaffna Tamil food I've had outside of Jaffna. The crab curry reminds me of my grandmother's cooking!",
      author: "Priyantha S.",
      location: "Jaffna",
      rating: 5
    },
    {
      text: "The Kachal Rice at VALDOR is absolutely divine. They use traditional Jaffna spices that you can't find anywhere else. A must-visit for food lovers!",
      author: "Kumari R.",
      location: "Colombo",
      rating: 5
    },
    {
      text: "Best Jaffna cuisine in Colombo. The fish ambul thiyal is exactly like what we get in Point Pedro. VALDOR is highly recommended!",
      author: "Tharshan M.",
      location: "Singapore",
      rating: 5
    },
    {
      text: "VALDOR brings the authentic flavors of Jaffna to Colombo. The mutton varuval is spicy and flavorful, just like home!",
      author: "Nishanthini K.",
      location: "London",
      rating: 5
    }
  ];

  // Navigation items for guests (not logged in)
  const guestNavigationItems = [
    { name: 'Home', href: '/', scrollTo: 'home' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Menu', href: '/menu' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '#contact', scrollTo: 'contact' },
  ];

  // Navigation items for authenticated users
  const authenticatedNavigationItems = [
    { name: 'Home', href: '/', scrollTo: 'home' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Menu', href: '/menu' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Dashboard', href: '/user/dashboard' },
  ];

  const navigationItems = user ? authenticatedNavigationItems : guestNavigationItems;

  const bottomNavItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveTab('home');
      }
    },
    {
      id: 'rooms',
      label: 'Rooms',
      icon: Bed,
      action: () => {
        navigate('/rooms');
        setActiveTab('rooms');
      }
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: ChefHat,
      action: () => {
        navigate('/menu');
        setActiveTab('menu');
      }
    },
    {
      id: 'booking',
      label: 'Book',
      icon: Calendar,
      action: () => {
        navigate('/booking');
        setActiveTab('booking');
      }
    },
    {
      id: 'my-bookings',
      label: 'My Bookings',
      icon: FileText,
      action: () => {
        navigate('/guest/my-bookings');
        setActiveTab('my-bookings');
      }
    },
    {
      id: 'check-in',
      label: 'Check-in',
      icon: CheckCircle,
      action: () => {
        navigate('/guest/check-in');
        setActiveTab('check-in');
      }
    },
    {
      id: 'services',
      label: 'Services',
      icon: MessageSquare,
      action: () => {
        navigate('/guest/my-requests');
        setActiveTab('services');
      }
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      action: () => {
        navigate('/guest/favorite-rooms');
        setActiveTab('favorites');
      }
    }
  ];

  // Fetch menu items and featured rooms from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setMenuLoading(true);
        const response = await foodService.getMenuItems({
          isAvailable: true,
          limit: 6 // Show only 6 items on homepage
        });
        setMenuItems(response.data || []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        // Fallback to static data if API fails
        setMenuItems(jaffnaSpecialties.slice(0, 6));
      } finally {
        setMenuLoading(false);
      }
    };

    const fetchFeaturedRooms = async () => {
      try {
        setRoomsLoading(true);
        // Use getAllRooms with limit parameter to get featured rooms
        const response = await roomService.getAllRooms({ limit: 6, status: 'Available' });
        setFeaturedRooms(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error fetching featured rooms:', error);
        // Fallback to static room data if API fails
        setFeaturedRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchMenuItems();
    fetchFeaturedRooms();
  }, []);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => {
      clearInterval(slideInterval);
      clearInterval(testimonialInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-lg border-b border-indigo-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl tracking-wider">V</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">VALDOR</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                item.scrollTo ? (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-indigo-50"
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.scrollTo === 'home') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        const element = document.getElementById(item.scrollTo);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-700 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-indigo-50"
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {/* Authentication Buttons */}
              {user ? (
                <div className="hidden lg:flex items-center space-x-3">
                  <Link
                    to="/user/dashboard"
                    className="text-gray-700 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-indigo-50"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-gray-700 hover:text-red-600 transition-colors font-medium rounded-lg hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden lg:block px-6 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all font-medium rounded-lg shadow-md hover:shadow-lg"
                >
                  Login
                </Link>
              )}

              {!user && (
                <Link
                  to="/food-ordering"
                  className="hidden lg:block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-200/50 transition-all duration-300"
                >
                  Order Food
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden bg-white border-t border-indigo-200/50 py-4"
            >
              {/* Authentication Section for Mobile */}
              <div className="px-4 pb-4 border-b border-indigo-200/50 mb-4">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-700" />
                      <span className="text-sm font-medium text-gray-700">
                        Welcome, {user.name?.split(' ')[0] || 'User'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                )}
              </div>

              <div className="space-y-2 px-4">
                {navigationItems.map((item) => (
                  item.scrollTo ? (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        if (item.scrollTo === 'home') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          const element = document.getElementById(item.scrollTo);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="block px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
                {!user && (
                  <Link
                    to="/food-ordering"
                    className="block px-4 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl transition-colors font-medium text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Order Food
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        {heroSlides.map((slide, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: index === currentSlide ? 1 : 0,
              scale: index === currentSlide ? 1 : 1.1
            }}
            transition={{ duration: 1.2 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${slide.image}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </motion.div>
        ))}

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {heroSlides[currentSlide].title}
            </h1>
            <h2 className="text-2xl md:text-3xl font-light mb-6 text-indigo-200">
              {heroSlides[currentSlide].subtitle}
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
              {heroSlides[currentSlide].description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              {user ? (
                // Authenticated user - direct navigation with 4 buttons
                <>
                  <Link
                    to="/rooms"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Browse Rooms
                  </Link>
                  <Link
                    to="/booking"
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Book a Room
                  </Link>
                  <Link
                    to="/menu"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Explore Our Menu
                  </Link>
                  <Link
                    to="/food-ordering"
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300"
                  >
                    Order for Delivery
                  </Link>
                </>
              ) : (
                // Guest user - redirect to login with 4 buttons
                <>
                  <Link
                    to="/login"
                    state={{ from: '/rooms' }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Browse Rooms
                  </Link>
                  <Link
                    to="/login"
                    state={{ from: '/booking' }}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Book a Room
                  </Link>
                  <Link
                    to="/login"
                    state={{ from: '/menu' }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Explore Our Menu
                  </Link>
                  <Link
                    to="/login"
                    state={{ from: '/food-ordering' }}
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300"
                  >
                    Order for Delivery
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-indigo-400 w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Quick Access Features Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Quick Access to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Our Services</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore all the features available for room booking, food ordering, and managing your stay
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Browse Rooms */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Bed className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Browse Rooms</h3>
              <p className="text-gray-600 text-sm mb-4">Explore our luxurious room options and find your perfect stay</p>
              {user ? (
                <Link
                  to="/rooms"
                  className="inline-block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  View Rooms
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/rooms' }}
                  className="inline-block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  Login to View
                </Link>
              )}
            </motion.div>

            {/* Book a Room */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Book a Room</h3>
              <p className="text-gray-600 text-sm mb-4">Make a reservation and secure your perfect accommodation</p>
              {user ? (
                <Link
                  to="/booking"
                  className="inline-block w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  Book Now
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/booking' }}
                  className="inline-block w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  Login to Book
                </Link>
              )}
            </motion.div>

            {/* My Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">My Bookings</h3>
              <p className="text-gray-600 text-sm mb-4">View and manage your room reservations and history</p>
              {user ? (
                <Link
                  to="/guest/my-bookings"
                  className="inline-block w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  View Bookings
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/guest/my-bookings' }}
                  className="inline-block w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed text-center"
                >
                  Login Required
                </Link>
              )}
            </motion.div>

            {/* Order Food */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Order Food</h3>
              <p className="text-gray-600 text-sm mb-4">Browse our menu and order authentic Jaffna cuisine</p>
              {user ? (
                <Link
                  to="/food-ordering"
                  className="inline-block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  Order Now
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/food-ordering' }}
                  className="inline-block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  Login to Order
                </Link>
              )}
            </motion.div>

            {/* Check-in/Check-out */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Check-in/Out</h3>
              <p className="text-gray-600 text-sm mb-4">Self-service check-in and check-out for your convenience</p>
              {user ? (
                <Link
                  to="/guest/check-in"
                  className="inline-block w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  Check-in/Out
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/guest/check-in' }}
                  className="inline-block w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed text-center"
                >
                  Login Required
                </Link>
              )}
            </motion.div>

            {/* My Food Orders */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">My Food Orders</h3>
              <p className="text-gray-600 text-sm mb-4">Track and manage your food order history</p>
              {user ? (
                <Link
                  to="/my-orders"
                  className="inline-block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  View Orders
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/my-orders' }}
                  className="inline-block w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed text-center"
                >
                  Login Required
                </Link>
              )}
            </motion.div>

            {/* Favorite Rooms */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Favorite Rooms</h3>
              <p className="text-gray-600 text-sm mb-4">Browse and manage your saved room preferences</p>
              {user ? (
                <Link
                  to="/guest/favorite-rooms"
                  className="inline-block w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  View Favorites
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/guest/favorite-rooms' }}
                  className="inline-block w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed text-center"
                >
                  Login Required
                </Link>
              )}
            </motion.div>

            {/* Service Requests */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Service Requests</h3>
              <p className="text-gray-600 text-sm mb-4">Request assistance or amenities during your stay</p>
              {user ? (
                <Link
                  to="/guest/my-requests"
                  className="inline-block w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  View Requests
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/guest/my-requests' }}
                  className="inline-block w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed text-center"
                >
                  Login Required
                </Link>
              )}
            </motion.div>

            {/* My Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">My Reviews</h3>
              <p className="text-gray-600 text-sm mb-4">Share your experience and manage your reviews</p>
              {user ? (
                <Link
                  to="/guest/reviews"
                  className="inline-block w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center"
                >
                  View Reviews
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/guest/reviews' }}
                  className="inline-block w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed text-center"
                >
                  Login Required
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section - Why Choose VALDOR */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Why Choose
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> VALDOR</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the perfect blend of luxury hospitality and authentic Jaffna Tamil cuisine
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Room Services Feature */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
                alt="Luxury Hotel Room"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold text-indigo-600 mb-1">500+</div>
                <div className="text-sm font-semibold text-gray-700">Happy Guests</div>
                <div className="text-xs text-gray-600">5-Star Reviews</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                <span className="text-indigo-600">Premium</span> Accommodation
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Indulge in our luxurious rooms and suites designed with modern amenities and elegant décor. 
                Each room offers comfort, style, and breathtaking views for an unforgettable stay.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Spacious rooms with ocean and city views</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">24/7 room service and concierge</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">High-speed WiFi and smart TV</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Premium bedding and spa-quality bathrooms</span>
                </li>
              </ul>
              {user ? (
                <Link
                  to="/rooms"
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Explore Our Rooms
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/rooms' }}
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Explore Our Rooms
                </Link>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Food Services Feature */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                <span className="text-indigo-600">Authentic</span> Jaffna Cuisine
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                VALDOR is the ultimate destination for authentic Jaffna Tamil cuisine, where we uphold the 
                traditions of Jaffna households while bringing out the authentic flavors of Sri Lanka with fresh seasonal ingredients.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Traditional Jaffna recipes passed down generations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Fresh seafood from Jaffna lagoon daily</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Expert chefs trained in Tamil culinary arts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Online ordering with delivery service</span>
                </li>
              </ul>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <div className="text-3xl font-bold text-indigo-600">15+</div>
                  <div className="text-gray-600 text-sm">Years Experience</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <div className="text-3xl font-bold text-indigo-600">50K+</div>
                  <div className="text-gray-600 text-sm">Dishes Served</div>
                </div>
              </div>
              {user ? (
                <Link
                  to="/menu"
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                >
                  View Our Menu
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/menu' }}
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                >
                  View Our Menu
                </Link>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-1 lg:order-2"
            >
              <img
                src="https://culturecolombo.lk/wp-content/uploads/2020/09/Sea-Food-Bowl-in-sri-lankan-style-750x632.jpg"
                alt="Jaffna Seafood Bowl"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-lg">
                <div className="text-4xl mb-2">🏮</div>
                <div className="text-sm font-semibold text-gray-700">Authentic</div>
                <div className="text-xs text-gray-600">Jaffna Flavors</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section - Prioritized */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Luxury Rooms & Suites
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our collection of elegant rooms designed for comfort and luxury during your stay at VALDOR
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomsLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </motion.div>
              ))
            ) : featuredRooms.length > 0 ? (
              featuredRooms.map((room, index) => (
                <motion.div
                  key={room._id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={room.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400';
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{room.title}</h3>
                        <p className="text-indigo-600 font-medium text-sm">{room.type || 'Standard Room'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-indigo-500">LKR {room.basePrice?.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">per night</div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{room.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Up to {room.capacity} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{room.roomNumber}</span>
                      </div>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {room.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    <Link
                      to="/booking"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center block"
                    >
                      Book Now
                    </Link>
                  </div>
                </motion.div>
              ))
            ) : (
              // Fallback static rooms
              [
                {
                  title: 'Deluxe Ocean View Suite',
                  type: 'Suite',
                  basePrice: 25000,
                  capacity: 4,
                  roomNumber: '101',
                  description: 'Spacious suite with stunning ocean views and modern amenities',
                  amenities: ['WiFi', 'AC', 'Ocean View', 'Balcony']
                },
                {
                  title: 'Executive Business Room',
                  type: 'Executive',
                  basePrice: 18000,
                  capacity: 2,
                  roomNumber: '205',
                  description: 'Perfect for business travelers with work desk and high-speed internet',
                  amenities: ['WiFi', 'Work Desk', 'AC', 'City View']
                },
                {
                  title: 'Standard Comfort Room',
                  type: 'Standard',
                  basePrice: 12000,
                  capacity: 2,
                  roomNumber: '312',
                  description: 'Comfortable room with all essential amenities for a pleasant stay',
                  amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge']
                }
              ].map((room, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/photo-${index === 0 ? '1631049307264' : index === 1 ? '1584132967332' : '1586023492125'}?w=400`}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{room.title}</h3>
                        <p className="text-indigo-600 font-medium text-sm">{room.type}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-indigo-500">LKR {room.basePrice.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">per night</div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{room.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Up to {room.capacity} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{room.roomNumber}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {room.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          +{room.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                    <Link
                      to="/booking"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center block"
                    >
                      Book Now
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/rooms"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 inline-block"
            >
              View All Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Jaffna Specialties Menu */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              VALDOR Jaffna Specialties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the authentic flavors of Jaffna Tamil cuisine at VALDOR, prepared with traditional recipes passed down through generations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </motion.div>
              ))
            ) : (
              menuItems.map((dish, index) => (
                <motion.div
                  key={dish._id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={dish.image || dish.imageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400';
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{dish.name}</h3>
                        <p className="text-indigo-600 font-medium text-sm">{dish.category?.name || dish.category || 'Main Course'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-indigo-500">LKR {parseFloat(dish.price * 100).toLocaleString()}</div>
                        <div className="text-sm">
                          {dish.isVeg && '🥬 Veg'}
                          {dish.isSpicy && '🌶️ Spicy'}
                          {dish.isPopular && '⭐ Popular'}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{dish.description}</p>
                    {user ? (
                      <Link
                        to="/food-ordering"
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center block"
                      >
                        Order Now
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-center block"
                      >
                        Login to Order
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/menu"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 inline-block"
            >
              View Complete Menu
            </Link>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Why VALDOR
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🏮',
                title: 'Authentic Jaffna Recipes',
                description: 'Traditional cooking methods and recipes passed down through generations of Jaffna Tamil families'
              },
              {
                icon: '🌊',
                title: 'Fresh Seafood Daily',
                description: 'Sourced directly from Jaffna waters and prepared fresh using traditional Sri Lankan techniques'
              },
              {
                icon: '🌶️',
                title: 'Signature Spice Blends',
                description: 'Unique Jaffna spice combinations that create unforgettable flavors you won\'t find elsewhere'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Our Guests Say
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
            >
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl mb-6 italic">
                "{testimonials[currentTestimonial].text}"
              </blockquote>
              <div className="border-t border-white/20 pt-6">
                <div className="font-semibold text-lg">{testimonials[currentTestimonial].author}</div>
                <div className="text-indigo-200">{testimonials[currentTestimonial].location}</div>
              </div>
            </motion.div>

            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Experience Authentic
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Jaffna Cuisine</span>
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of satisfied customers who have discovered their new favorite Jaffna Tamil dining destination
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/food-ordering"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 transform hover:scale-105"
              >
                Order for Delivery
              </Link>
              <Link
                to="/menu"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300"
              >
                Browse Full Menu
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section
        id="gallery"
        className="py-20 bg-gradient-to-r from-gray-50 to-orange-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Our Gallery
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the vibrant atmosphere and culinary artistry of VALDOR through our gallery
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
              'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
              'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
              'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
              'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400'
            ].map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl shadow-lg group cursor-pointer"
              >
                <img
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/gallery"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 inline-block transform hover:scale-105"
            >
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Contact Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get in touch with VALDOR for reservations, inquiries, or to experience authentic Jaffna Tamil cuisine
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📍</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Location</h3>
                  <p className="text-gray-600">Jaffna Road, Colombo, Sri Lanka</p>
                  <p className="text-gray-600">Near major landmarks and easily accessible</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📞</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Phone</h3>
                  <p className="text-gray-600">+94 11 234 5678</p>
                  <p className="text-gray-600">Available for reservations and inquiries</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">✉️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Email</h3>
                  <p className="text-gray-600">info@valdor.lk</p>
                  <p className="text-gray-600">We respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">🕒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Opening Hours</h3>
                  <p className="text-gray-600">Monday - Thursday: 12:00 PM - 3:30 PM & 6:30 PM - 10:30 PM</p>
                  <p className="text-gray-600">Friday - Sunday: 12:00 PM - 3:30 PM & 6:30 PM - 10:30 PM</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <textarea
                  rows="5"
                  placeholder="Your Message"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-200/50 transition-all duration-300 transform hover:scale-105"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {bottomNavItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-500 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:pb-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl tracking-wider">V</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">VALDOR</span>
              </div>
              <p className="text-gray-400 mb-4">
                VALDOR brings authentic Jaffna Tamil cuisine to Colombo with traditional recipes and fresh ingredients from Jaffna's coastal regions.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">📘</a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">📷</a>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">⭐</a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#home" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><Link to="/menu" className="text-gray-400 hover:text-white transition-colors">Menu</Link></li>
                <li><a href="#gallery" className="text-gray-400 hover:text-white transition-colors">Gallery</a></li>
                <li><a href="#reservation" className="text-gray-400 hover:text-white transition-colors">Reservation</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Opening Hours</h3>
              <div className="text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>MONDAY – THURSDAY</span>
                  <span>12.00 – 3.30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>FRIDAY – SUNDAY</span>
                  <span>12.00 – 3.30 PM</span>
                </div>
                <div className="text-sm mt-2">(Hours might differ)</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="text-gray-400 space-y-2">
                <p>📍 Jaffna Road, Colombo, Sri Lanka</p>
                <p>📞 (+94) 11 234 5678</p>
                <p>✉️ info@valdor.lk</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VALDOR. All rights reserved. Made with ❤️ for Jaffna Tamil cuisine lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
