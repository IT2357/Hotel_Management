// 📁 frontend/src/pages/ModernGuestDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  ShoppingCart,
  Clock,
  Star,
  Heart,
  User,
  Settings,
  LogOut,
  Utensils,
  Coffee,
  Award,
  TrendingUp,
  Calendar,
  Bell,
  MapPin,
  Phone,
  Mail,
  Menu as MenuIcon,
  X,
  Home,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ModernGuestDashboard = () => {
  const { user, logout } = useAuth();
  const { addToCart, cartItems = [] } = useCart();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    // Load recent orders and favorites
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock data - replace with actual API calls
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        date: '2024-01-15',
        total: 45.99,
        status: 'delivered',
        items: ['Grilled Salmon', 'Caesar Salad'],
        review: { rating: 5, comment: 'Excellent food!' }
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        date: '2024-01-12',
        total: 32.50,
        status: 'delivered',
        items: ['Margherita Pizza', 'Iced Coffee'],
        review: null
      }
    ];

    setRecentOrders(mockOrders);

    // Count pending reviews
    const pending = mockOrders.filter(order =>
      order.status === 'delivered' && !order.review
    ).length;
    setPendingReviews(pending);

    setFavoriteItems([
      {
        id: 1,
        name: 'Truffle Pasta',
        price: 28.99,
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
        rating: 4.8
      },
      {
        id: 2,
        name: 'Beef Wellington',
        price: 45.99,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
        rating: 4.9
      }
    ]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/guest/dashboard', icon: Home, current: true },
    { name: 'Menu', href: '/menu', icon: ChefHat, current: false },
    { name: 'Food Ordering', href: '/food-ordering', icon: Utensils, current: false },
    { name: 'My Orders', href: '/my-orders', icon: FileText, current: false },
    { name: 'Reviews', href: '/dashboard/reviews', icon: MessageSquare, current: false, badge: pendingReviews || 0 },
    { name: 'Cart', href: '/cart', icon: ShoppingCart, current: false, badge: getItemCount() || 0 },
    { name: 'Favorites', href: '/dashboard/favorites', icon: Heart, current: false },
  ];

  const stats = [
    {
      label: 'Total Orders',
      value: '24',
      icon: Utensils,
      color: 'text-purple-400'
    },
    {
      label: 'Favorite Items',
      value: favoriteItems?.length?.toString() || '0',
      icon: Heart,
      color: 'text-red-400'
    },
    {
      label: 'Loyalty Points',
      value: '1,250',
      icon: Award,
      color: 'text-yellow-400'
    },
    {
      label: 'Member Since',
      value: '2023',
      icon: Calendar,
      color: 'text-blue-400'
    }
  ];

  const quickActions = [
    {
      title: 'Browse Menu',
      description: 'Explore our delicious offerings',
      icon: ChefHat,
      color: 'from-purple-600 to-pink-600',
      link: '/menu',
      count: null
    },
    {
      title: 'Order Food',
      description: 'Order delicious food from our menu',
      icon: Utensils,
      color: 'from-blue-600 to-cyan-600',
      link: '/food-ordering',
      count: null
    },
    {
      title: 'My Orders',
      description: 'View your past orders',
      icon: Clock,
      color: 'from-green-600 to-emerald-600',
      link: '/dashboard/my-orders',
      count: recentOrders?.length || 0
    },
    {
      title: 'Favorites',
      description: 'Your favorite dishes',
      icon: Heart,
      color: 'from-red-600 to-rose-600',
      link: '/dashboard/favorites',
      count: favoriteItems?.length || 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: sidebarOpen ? 0 : -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-sm border-r border-indigo-200/50 shadow-2xl lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex items-center justify-between p-6 border-b border-indigo-200/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-gray-800 font-bold">Guest Portal</h2>
              <p className="text-gray-600 text-sm">{user?.name || 'Guest'}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-4">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 mb-2 group"
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.name}</span>
              {item.badge > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full ml-auto shadow-lg">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-xl transition-all duration-200 font-medium shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-indigo-200/50 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Guest Dashboard</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Welcome back, {user?.name?.split(' ')[0] || 'Guest'}! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Ready to explore our culinary delights?
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={action.link}
                    className="block group"
                  >
                    <div className="relative bg-white rounded-2xl p-6 border border-indigo-200/50 shadow-lg hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 overflow-hidden group-hover:border-indigo-300">
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <action.icon className="w-6 h-6 text-white" />
                          </div>
                          {action.count !== null && action.count > 0 && (
                            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full shadow-lg font-semibold">
                              {action.count}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 text-sm font-medium">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 border border-indigo-200/50 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Recent Orders
                </h3>
                <Link
                  to="/my-orders"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {recentOrders?.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <div className="text-gray-800 font-semibold">
                        {order.orderNumber}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {order.items.join(', ')}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {order.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 font-bold">
                        ${order.total}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {order.status}
                        </span>
                        {order.status === 'delivered' && (
                          <div className="flex items-center gap-1">
                            {order.review ? (
                              <>
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-yellow-600 font-medium">{order.review.rating}</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">Not reviewed</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Favorite Items */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 border border-indigo-200/50 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  Your Favorites
                </h3>
                <Link
                  to="/dashboard/favorites"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {favoriteItems?.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover shadow-md"
                    />
                    <div className="flex-1">
                      <div className="text-gray-800 font-semibold">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-gray-600 text-sm font-medium">
                            {item.rating}
                          </span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-indigo-600 font-bold">
                          ${item.price}
                        </span>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Restaurant Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200/50 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              Restaurant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-gray-800 font-bold">Location</div>
                  <div className="text-gray-600 text-sm">123 Culinary Street, Food City</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-gray-800 font-bold">Phone</div>
                  <div className="text-gray-600 text-sm">+1 (555) 123-4567</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-gray-800 font-bold">Hours</div>
                  <div className="text-gray-600 text-sm">Mon-Sun: 11AM - 11PM</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ModernGuestDashboard;
