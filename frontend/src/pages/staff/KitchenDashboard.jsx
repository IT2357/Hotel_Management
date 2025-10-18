// 📁 frontend/src/pages/staff/KitchenDashboard.jsx
// Kitchen Dashboard Page for Staff Members
// Real-time task management with Socket.io integration
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SharedNavbar from '../../components/shared/SharedNavbar';
import KitchenQueueView from '../../components/food/KitchenQueueView';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  TrendingUp,
  Bell,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import FoodButton from '../../components/food/FoodButton';
import FoodBadge from '../../components/food/FoodBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/food/FoodCard';
import foodService from '../../services/foodService';

const KitchenDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [staffId, setStaffId] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    totalToday: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get user info from localStorage
    const role = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (!role || !userId) {
      navigate('/login');
      return;
    }

    // Check if user has permission to access kitchen
    if (!['staff', 'manager', 'admin'].includes(role)) {
      navigate('/');
      return;
    }

    setUserRole(role);
    setStaffId(userId);
  }, [navigate]);

  // Fetch kitchen statistics and orders
  useEffect(() => {
    const fetchKitchenData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsResponse, ordersResponse] = await Promise.all([
          foodService.getKitchenStats(),
          foodService.getKitchenOrders({ 
            status: filter === 'all' ? undefined : filter,
            search: searchTerm || undefined
          })
        ]);
        
        setStats(statsResponse.data || stats);
        setRecentOrders(ordersResponse.data || []);
      } catch (err) {
        console.error('Error fetching kitchen data:', err);
        setError('Failed to load kitchen data');
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchKitchenData();
      
      // Refresh data every 30 seconds
      const interval = setInterval(fetchKitchenData, 30000);
      return () => clearInterval(interval);
    }
  }, [staffId, filter, searchTerm]);

  if (!userRole || !staffId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Navigation */}
      <SharedNavbar showBackButton={true} backPath="/dashboard" />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#4A4A4A] mb-2">Kitchen Dashboard</h1>
                <p className="text-[#4A4A4A]/70">Manage food orders and kitchen operations</p>
              </div>
              <div className="flex items-center gap-3">
                <FoodButton
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-[#FF9933] border-[#FF9933] hover:bg-[#FF9933]/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </FoodButton>
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/80">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/80">Preparing</p>
                    <p className="text-2xl font-bold">{stats.preparing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/80">Ready</p>
                    <p className="text-2xl font-bold">{stats.ready}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/80">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-[#FF9933] to-[#CC7A29] text-white">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/80">Today's Total</p>
                    <p className="text-2xl font-bold">{stats.totalToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A4A4A]/50 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search orders by ID, customer name, or items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                    >
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                    </select>
                    <FoodButton
                      variant="outline"
                      className="border-[#FF9933] text-[#FF9933] hover:bg-[#FF9933]/10"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </FoodButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-red-800">Error Loading Data</h3>
                      <p className="text-red-600">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Kitchen Queue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <KitchenQueueView 
              staffId={staffId} 
              userRole={userRole}
              filter={filter}
              searchTerm={searchTerm}
              onStatsUpdate={setStats}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;
