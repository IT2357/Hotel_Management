import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChefHat,
  ShoppingCart,
  Sparkles,
  BarChart3,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  Star,
  Eye,
  Settings,
  Plus,
  FileText,
  Image,
  Globe,
  FolderOpen,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Grid3x3,
  LayoutGrid,
  Utensils,
  Receipt,
  Tag,
  Calendar
} from 'lucide-react';
import FoodCard from "../../components/food/FoodCard";
import FoodButton from "../../components/food/FoodButton";
import api from '../../services/api';

const Card = FoodCard;

export default function EnhancedFoodManagementPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalMenuItems: 0,
    activeMenuItems: 0,
    categories: 0,
    todayOrders: 0,
    weekRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [orderStats, menuStats, categoriesResponse, ordersResponse] = await Promise.all([
        api.get('/food/orders/stats'),
        api.get('/menu/items?limit=1'),
        api.get('/food/categories'),
        api.get('/food/orders?limit=5')
      ]);

      const categories = categoriesResponse.data?.data || categoriesResponse.data || [];
      const orders = ordersResponse.data?.data || [];

      setStats({
        totalOrders: orderStats.data.data?.totalOrders || 0,
        pendingOrders: orderStats.data.data?.pendingOrders || 0,
        totalRevenue: orderStats.data.data?.totalRevenue || 0,
        totalMenuItems: menuStats.data.count || 0,
        activeMenuItems: menuStats.data.data?.filter(item => item.isAvailable).length || 0,
        categories: categories.length,
        todayOrders: orderStats.data.data?.todayOrders || 0,
        weekRevenue: orderStats.data.data?.weekRevenue || 0
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Add Menu Item",
      description: "Create new dish",
      icon: Plus,
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/admin/food/menu")
    },
    {
      title: "View Orders",
      description: "Manage orders",
      icon: Receipt,
      color: "from-purple-500 to-purple-600",
      action: () => navigate("/admin/food/orders")
    },
    {
      title: "Offers & Discounts",
      description: "Create deals",
      icon: Tag,
      color: "from-rose-500 to-rose-600",
      action: () => navigate("/admin/food/offers")
    },
    {
      title: "AI Menu Extract",
      description: "Upload menu",
      icon: Sparkles,
      color: "from-pink-500 to-pink-600",
      action: () => navigate("/admin/food/ai-menu")
    },
    {
      title: "Categories",
      description: "Organize menu",
      icon: FolderOpen,
      color: "from-amber-500 to-amber-600",
      action: () => navigate("/admin/food/categories")
    }
  ];

  const mainSections = [
    {
      id: "menu",
      title: "Menu Management",
      description: "Manage your complete food menu with categories, items, and pricing",
      icon: ChefHat,
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      stats: [
        { label: "Total Items", value: stats.totalMenuItems, icon: Utensils },
        { label: "Active", value: stats.activeMenuItems, icon: CheckCircle2 },
        { label: "Categories", value: stats.categories, icon: LayoutGrid }
      ],
      features: [
        { text: "Add & edit menu items", icon: Plus },
        { text: "Upload food images", icon: Image },
        { text: "Set pricing & availability", icon: DollarSign },
        { text: "Organize by categories", icon: FolderOpen }
      ],
      to: "/admin/food/menu",
      bgImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"
    },
    {
      id: "orders",
      title: "Order Management",
      description: "Track and manage all customer food orders in real-time",
      icon: ShoppingCart,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      stats: [
        { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart },
        { label: "Pending", value: stats.pendingOrders, icon: Clock, highlight: true },
        { label: "Today", value: stats.todayOrders, icon: Calendar }
      ],
      features: [
        { text: "View all orders", icon: Eye },
        { text: "Update order status", icon: CheckCircle2 },
        { text: "Customer reviews", icon: Star },
        { text: "Order analytics", icon: BarChart3 }
      ],
      to: "/admin/food/orders",
      bgImage: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80"
    },
    {
      id: "categories",
      title: "Category Management",
      description: "Organize your menu into logical categories for easy navigation",
      icon: FolderOpen,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      stats: [
        { label: "Categories", value: stats.categories, icon: FolderOpen },
        { label: "Items/Cat", value: stats.categories > 0 ? Math.round(stats.totalMenuItems / stats.categories) : 0, icon: Grid3x3 }
      ],
      features: [
        { text: "Create categories", icon: Plus },
        { text: "Add category icons", icon: Image },
        { text: "Organize structure", icon: LayoutGrid },
        { text: "Toggle active/inactive", icon: Settings }
      ],
      to: "/admin/food/categories",
      bgImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
    },
    {
      id: "ai-menu",
      title: "AI Menu Extractor",
      description: "Extract menu items from images and URLs using advanced AI",
      icon: Sparkles,
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      stats: [
        { label: "AI Powered", value: "✨", icon: Sparkles }
      ],
      features: [
        { text: "Upload menu images", icon: Image },
        { text: "Extract from URLs", icon: Globe },
        { text: "Wikipedia integration", icon: FileText },
        { text: "Batch creation", icon: Package }
      ],
      to: "/admin/food/ai-menu",
      bgImage: "https://images.unsplash.com/photo-1581349485608-9469926a8e5e?w=800&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80')] opacity-10 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 via-red-600/90 to-pink-600/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Food Management Hub
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Complete control over your restaurant operations - from menu to delivery
            </p>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">{stats.totalOrders}</div>
                <div className="text-sm text-white/80">Total Orders</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(0)}</div>
                <div className="text-sm text-white/80">Revenue</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">{stats.totalMenuItems}</div>
                <div className="text-sm text-white/80">Menu Items</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white">{stats.pendingOrders}</div>
                <div className="text-sm text-white/80">Pending</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                onClick={action.action}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative group bg-gradient-to-br ${action.color} p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-left overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                <action.icon className="w-8 h-8 text-white mb-3 relative z-10" />
                <h3 className="text-lg font-bold text-white mb-1 relative z-10">{action.title}</h3>
                <p className="text-sm text-white/80 relative z-10">{action.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Sections - Category Based */}
        <div className="space-y-8">
          {mainSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="group"
            >
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100">
                {/* Background Image Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
                  <img 
                    src={section.bgImage} 
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative z-20 p-8 lg:p-10">
                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Title & Description */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-6 mb-6">
                        <div className={`p-4 bg-gradient-to-br ${section.gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <section.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold text-gray-900 group-hover:text-white transition-colors duration-300 mb-2">
                            {section.title}
                          </h3>
                          <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300 text-lg">
                            {section.description}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mb-6">
                        {section.stats.map((stat, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                              stat.highlight 
                                ? 'bg-orange-100 border-2 border-orange-300 group-hover:bg-white/20' 
                                : 'bg-gray-100 group-hover:bg-white/20'
                            } transition-all duration-300`}
                          >
                            <stat.icon className={`w-5 h-5 ${
                              stat.highlight ? 'text-orange-600' : 'text-gray-600'
                            } group-hover:text-white transition-colors duration-300`} />
                            <div>
                              <div className={`text-2xl font-bold ${
                                stat.highlight ? 'text-orange-600' : 'text-gray-900'
                              } group-hover:text-white transition-colors duration-300`}>
                                {stat.value}
                              </div>
                              <div className="text-xs text-gray-600 group-hover:text-white/70 transition-colors duration-300">
                                {stat.label}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Features Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {section.features.map((feature, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-2 text-gray-700 group-hover:text-white transition-colors duration-300"
                          >
                            <feature.icon className="w-4 h-4 text-green-600 group-hover:text-green-300 transition-colors duration-300" />
                            <span className="text-sm">{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="lg:col-span-1 flex items-center justify-center lg:justify-end">
                      <NavLink
                        to={section.to}
                        className={`group/btn inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br ${section.gradient} text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                      >
                        <span className="text-lg">Access Now</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </NavLink>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Analytics Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Revenue Trend</h4>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${stats.weekRevenue.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">This week's revenue</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Active Items</h4>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.activeMenuItems}/{stats.totalMenuItems}
            </div>
            <p className="text-sm text-gray-600">Menu availability rate</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Pending Orders</h4>
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {stats.pendingOrders}
            </div>
            <p className="text-sm text-gray-600">Require attention</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

