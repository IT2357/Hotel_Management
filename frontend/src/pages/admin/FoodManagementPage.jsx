import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink } from 'react-router-dom';
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
  FolderOpen
} from 'lucide-react';
import Card from '../../components/ui/Card';
import api from '../../services/api';

export default function FoodManagementPage() {
   const { user } = useContext(AuthContext);
   const [stats, setStats] = useState({
     totalOrders: 0,
     pendingOrders: 0,
     totalRevenue: 0,
     totalMenuItems: 0,
     activeMenuItems: 0
   });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     fetchStats();
   }, []);

   const fetchStats = async () => {
     try {
       setLoading(true);
       const [orderStats, menuStats] = await Promise.all([
         api.get('/food/orders/stats'),
         api.get('/menu/items?limit=1') // Just to get total count
       ]);

       setStats({
         totalOrders: orderStats.data.data?.totalOrders || 0,
         pendingOrders: orderStats.data.data?.pendingOrders || 0,
         totalRevenue: orderStats.data.data?.totalRevenue || 0,
         totalMenuItems: menuStats.data.count || 0,
         activeMenuItems: menuStats.data.data?.filter(item => item.isAvailable).length || 0
       });
     } catch (error) {
       console.error('Error fetching stats:', error);
     } finally {
       setLoading(false);
     }
   };

  const foodManagementSections = [
    {
      title: "Order Management",
      description: "Manage food orders, track status, and handle customer requests",
      icon: ShoppingCart,
      color: "from-blue-500 to-indigo-500",
      stats: `${stats.totalOrders} orders`,
      badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : null,
      to: "/admin/food/orders",
      features: [
        "View all food orders",
        "Update order status",
        "Manage customer reviews",
        "Track order analytics"
      ]
    },
    {
      title: "Menu Management",
      description: "Create, edit, and organize your restaurant menu items",
      icon: ChefHat,
      color: "from-green-500 to-emerald-500",
      stats: `${stats.activeMenuItems}/${stats.totalMenuItems} active`,
      to: "/admin/food/menu",
      features: [
        "Add/edit menu items",
        "Upload food images",
        "Manage categories",
        "Set pricing & availability"
      ]
    },
    {
      title: "AI Menu Extractor",
      description: "Extract menu items from images, URLs, or Wikipedia using AI",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      stats: "AI Powered",
      to: "/admin/menu-upload",
      features: [
        "Upload menu images",
        "Extract from URLs",
        "Wikipedia integration",
        "Batch menu creation"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <ChefHat className="w-16 h-16 text-orange-200 mr-4" />
              <h1 className="text-5xl font-bold">🍽️ Food Management Hub</h1>
            </div>
            <p className="text-orange-100 text-xl mb-6 max-w-3xl mx-auto">
              Complete control over your restaurant's menu, orders, and AI-powered menu extraction system
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-orange-200">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>{stats.totalMenuItems} Menu Items</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>{stats.totalOrders} Total Orders</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>${stats.totalRevenue.toFixed(2)} Revenue</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{stats.pendingOrders} Pending Orders</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{loading ? "..." : stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-orange-600">{loading ? "..." : stats.pendingOrders}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Menu Items</p>
                <p className="text-3xl font-bold text-green-600">{loading ? "..." : stats.totalMenuItems}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600">${loading ? "..." : stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Management Sections */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {foodManagementSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group hover:-translate-y-1">
                <div className={`bg-gradient-to-r ${section.color} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <section.icon className="h-12 w-12 text-white/90" />
                      {section.badge && (
                        <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-full backdrop-blur-sm">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{section.title}</h3>
                    <p className="text-white/90 text-sm mb-3">{section.description}</p>
                    <div className="flex items-center text-white/80 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>{section.stats}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <ul className="space-y-2 mb-6">
                    {section.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <NavLink
                    to={section.to}
                    className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group"
                  >
                    <span>Access {section.title}</span>
                    <section.icon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </NavLink>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Tools Section */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">🛠️ Additional Tools</h2>
            <p className="text-muted-foreground">Advanced features for comprehensive food management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <Image className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Image Analysis</h3>
              <p className="text-sm text-muted-foreground">AI-powered food image recognition and analysis</p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">URL Extraction</h3>
              <p className="text-sm text-muted-foreground">Extract menus from restaurant websites automatically</p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Wikipedia AI</h3>
              <p className="text-sm text-muted-foreground">Cultural and historical menu context with AI</p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800">
              <FolderOpen className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">File Processing</h3>
              <p className="text-sm text-muted-foreground">Process menu files from local storage or paths</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
