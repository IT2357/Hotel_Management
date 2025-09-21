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

  useEffect(() => {
    // Load recent orders and favorites
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock data - replace with actual API calls
    setRecentOrders([
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        date: '2024-01-15',
        total: 45.99,
        status: 'delivered',
        items: ['Grilled Salmon', 'Caesar Salad']
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        date: '2024-01-12',
        total: 32.50,
        status: 'delivered',
        items: ['Margherita Pizza', 'Iced Coffee']
      }
    ]);

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
    { name: 'My Orders', href: '/dashboard/my-orders', icon: FileText, current: false },
    { name: 'Reviews', href: '/dashboard/reviews', icon: MessageSquare, current: false },
    { name: 'Cart', href: '/cart', icon: ShoppingCart, current: false, badge: cartItems?.length || 0 },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: sidebarOpen ? 0 : -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-800/95 backdrop-blur-sm border-r border-purple-500/20 lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Guest Portal</h2>
              <p className="text-gray-400 text-sm">{user?.name || 'Guest'}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-4 px-4">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-1"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-auto">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-slate-800/50 backdrop-blur-sm border-b border-purple-500/20 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-white">Guest Dashboard</h1>
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
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Guest'}! 👋
            </h1>
            <p className="text-gray-400">
              Ready to explore our culinary delights?
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20"
              >
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">
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
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={action.link}
                    className="block group"
                  >
                    <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 overflow-hidden">
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center`}>
                            <action.icon className="w-6 h-6 text-white" />
                          </div>
                          {action.count !== null && action.count > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {action.count}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
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
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Orders</h3>
                <Link
                  to="/dashboard/my-orders"
                  className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-4">
                {recentOrders?.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl"
                  >
                    <div>
                      <div className="text-white font-medium">
                        {order.orderNumber}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {order.items.join(', ')}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {order.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        ${order.total}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.status}
                      </span>
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
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Your Favorites</h3>
                <Link
                  to="/dashboard/favorites"
                  className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-4">
                {favoriteItems?.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-colors cursor-pointer"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-gray-400 text-sm">
                            {item.rating}
                          </span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-purple-400 font-semibold">
                          ${item.price}
                        </span>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-red-400 fill-current" />
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
            className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Restaurant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-white font-medium">Location</div>
                  <div className="text-gray-400 text-sm">123 Culinary Street, Food City</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-white font-medium">Phone</div>
                  <div className="text-gray-400 text-sm">+1 (555) 123-4567</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-white font-medium">Hours</div>
                  <div className="text-gray-400 text-sm">Mon-Sun: 11AM - 11PM</div>
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
