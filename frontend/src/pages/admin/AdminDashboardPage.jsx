import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink } from "react-router-dom";
import Card from "../../components/ui/Card";
import { formatCurrency } from "../../utils/currencyUtils";

export default function AdminDashboardPage() {
  const { user } = useContext(AuthContext);
  const [bookingStats, setBookingStats] = useState({});
  const [invoiceStats, setInvoiceStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [foodStats, setFoodStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [bookingResponse, invoiceResponse, userResponse, foodOrderResponse] = await Promise.all([
        fetch('/api/bookings/admin/stats?period=all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/invoices/admin/stats?period=all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/users/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/food/orders/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const bookingData = await bookingResponse.json();
      const invoiceData = await invoiceResponse.json();
      const userData = await userResponse.json();
      const foodData = await foodOrderResponse.json();

      if (bookingData.success) {
        setBookingStats(bookingData.data);
      }
      if (invoiceData.success) {
        setInvoiceStats(invoiceData.data);
      }
      if (userData.success) {
        setUserStats(userData.data);
      }
      if (foodData.success) {
        setFoodStats(foodData.data || {});
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStatsItems = [
    {
      title: "Total Bookings",
      stat: bookingStats.totalBookings || 0,
      description: "All time bookings",
      icon: "📊",
      color: "from-indigo-500 to-purple-600",
    },
    {
      title: "Pending Approvals",
      stat: bookingStats.pendingApprovals || 0,
      description: "Require review",
      icon: "⏳",
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Confirmed",
      stat: bookingStats.confirmed || 0,
      description: "Ready for check-in",
      icon: "✅",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Revenue",
      stat: formatCurrency(bookingStats.totalRevenue || 0),
      description: "Total bookings value",
      icon: "💰",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  const dashboardItems = [
    {
      title: "Bookings",
      to: "/admin/bookings",
      description: "View and handle reservations.",
      icon: "📅",
      color: "from-green-400 to-emerald-500",
      stats: {
        count: bookingStats.totalBookings || 0,
        subtitle: "Total bookings",
        badge: bookingStats.pendingApprovals || 0,
        badgeLabel: "Pending"
      }
    },
    {
      title: "Invoices",
      to: "/admin/invoices",
      description: "Manage invoices and payments.",
      icon: "📄",
      color: "from-purple-400 to-pink-500",
      stats: {
        count: invoiceStats.totalInvoices || 0,
        subtitle: "Total invoices",
        badge: invoiceStats.pending || 0,
        badgeLabel: "Pending"
      }
    },
    {
      title: "Food Management",
      to: "/admin/food",
      description: "Manage menu items, orders, and food services.",
      icon: "🍽️",
      color: "from-orange-400 to-red-500",
      stats: {
        count: foodStats.totalOrders || 0,
        subtitle: "Total orders",
        badge: foodStats.pendingOrders || 0,
        badgeLabel: "Pending"
      }
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name?.split(" ")[0] || "Admin"}! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Here's what's happening with your hotel today
            </p>
          </div>
          <div className="flex gap-3">
            <NavLink
              to="/admin/settings"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              ⚙️ Settings
            </NavLink>
          </div>
        </div>

        {/* Stats Overview Cards - Keeping as requested */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStatsItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:scale-105 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-md`}>
                    {item.icon}
                  </div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Live
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {item.title}
                </h3>
                <div className={`font-bold text-gray-900 mb-2 ${item.title === "Revenue" ? "text-2xl line-clamp-1" : "text-3xl"}`}>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                  ) : (
                    item.stat
                  )}
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <div className={`h-1.5 bg-gradient-to-r ${item.color}`}></div>
            </div>
          ))}
        </div>

        {/* Main Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Management Cards */}
          {dashboardItems.map(({ title, description, to, icon, color, stats }) => (
            <NavLink
              key={title}
              to={to}
              className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                  </div>
                  {stats && stats.badge > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                      {stats.badge}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {description}
                </p>
                {stats && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{stats.count}</span>
                      <span className="text-xs text-gray-500">{stats.subtitle}</span>
                    </div>
                    {stats.badge > 0 && (
                      <div className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        {stats.badgeLabel}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 pb-6">
                <div className={`w-full text-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r ${color} text-white group-hover:shadow-lg transition-all duration-300`}>
                  Manage {title} →
                </div>
              </div>
            </NavLink>
          ))}
        </div>

        {/* Quick Actions & Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Access Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ⚡ Quick Access
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NavLink
                  to="/admin/bookings"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-md border border-blue-100"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📅</div>
                  <div className="text-sm font-semibold text-gray-900">Bookings</div>
                  <div className="text-xs text-gray-500 mt-1">{bookingStats.totalBookings || 0} total</div>
                </NavLink>
                <NavLink
                  to="/admin/invoices"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:shadow-md border border-green-100"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</div>
                  <div className="text-sm font-semibold text-gray-900">Invoices</div>
                  <div className="text-xs text-gray-500 mt-1">{invoiceStats.totalInvoices || 0} total</div>
                </NavLink>
                <NavLink
                  to="/admin/food"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-300 hover:shadow-md border border-orange-100"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🍽️</div>
                  <div className="text-sm font-semibold text-gray-900">Food</div>
                  <div className="text-xs text-gray-500 mt-1">{foodStats.totalOrders || 0} orders</div>
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover:shadow-md border border-purple-100"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                  <div className="text-sm font-semibold text-gray-900">Users</div>
                  <div className="text-xs text-gray-500 mt-1">{userStats.totalUsers || 0} users</div>
                </NavLink>
                <NavLink
                  to="/admin/rooms"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl hover:from-teal-100 hover:to-cyan-100 transition-all duration-300 hover:shadow-md border border-teal-100"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏨</div>
                  <div className="text-sm font-semibold text-gray-900">Rooms</div>
                  <div className="text-xs text-gray-500 mt-1">Manage</div>
                </NavLink>
                <NavLink
                  to="/admin/settings"
                  className="group flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl hover:from-gray-100 hover:to-slate-100 transition-all duration-300 hover:shadow-md border border-gray-200"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
                  <div className="text-sm font-semibold text-gray-900">Settings</div>
                  <div className="text-xs text-gray-500 mt-1">Configure</div>
                </NavLink>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📈 Today's Overview
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                    ✅
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Confirmed</div>
                    <div className="text-xs text-gray-500">Ready for check-in</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">{bookingStats.confirmed || 0}</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">
                    ⏳
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Pending</div>
                    <div className="text-xs text-gray-500">Awaiting approval</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-yellow-600">{bookingStats.pendingApprovals || 0}</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                    💰
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Revenue</div>
                    <div className="text-xs text-gray-500">Total earnings</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(bookingStats.totalRevenue || 0)}</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Paid Invoices</div>
                    <div className="text-xs text-gray-500">Completed payments</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-purple-600">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    invoiceStats.paid || 0
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.[0] || "A"}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{user?.name || "Administrator"}</div>
                <div className="text-sm text-gray-500">{user?.email || "admin@hotel.com"}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="hidden sm:block">•</div>
              <div className="text-gray-500">Last updated: just now</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}