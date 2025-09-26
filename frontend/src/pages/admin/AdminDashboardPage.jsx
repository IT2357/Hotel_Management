import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink } from "react-router-dom";
import Card from "../../components/ui/Card";

export default function AdminDashboardPage() {
  const { user } = useContext(AuthContext);
  const [bookingStats, setBookingStats] = useState({});
  const [invoiceStats, setInvoiceStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [bookingResponse, invoiceResponse, userResponse] = await Promise.all([
        fetch('/api/bookings/admin/stats?period=all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/invoices/admin/stats?period=all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/users/admin/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const bookingData = await bookingResponse.json();
      const invoiceData = await invoiceResponse.json();
      const userData = await userResponse.json();

      if (bookingData.success) {
        setBookingStats(bookingData.data);
      }
      if (invoiceData.success) {
        setInvoiceStats(invoiceData.data);
      }
      if (userData.success) {
        setUserStats(userData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
        badge: invoiceStats.paid || 0,
        badgeLabel: "Paid"
      }
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Modern Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight">
              👋 Welcome, {user?.name?.split(" ")[0] || "Admin"}!
            </h1>
            <p className="text-indigo-100 text-base sm:text-lg">
              Your central hub for managing the hotel system.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center flex-1">
              <div className="text-2xl font-bold">{bookingStats.totalBookings || 0}</div>
              <div className="text-sm text-indigo-100 mt-1">Total Bookings</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center flex-1">
              <div className="text-2xl font-bold">{formatCurrency(bookingStats.totalRevenue || 0)}</div>
              <div className="text-sm text-indigo-100 mt-1">Revenue</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStatsItems.map((item, index) => (
          <Card
            key={index}
            className="shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="text-2xl mr-2">{item.icon}</span> {item.title}
              </h3>
              <div className="text-4xl font-extrabold text-gray-800 mt-2">
                {loading ? "..." : item.stat}
              </div>
              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
            </div>
            <div className={`h-1 bg-gradient-to-r ${item.color}`}></div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardItems.map(({ title, description, to, icon, color, stats }) => (
          <Card
            key={title}
            className="shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
                <span className="text-xl mr-2">{icon}</span> {title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{description}</p>
              {stats && (
                <div className="flex items-center text-xs text-gray-500 h-6">
                  {stats.count !== undefined && (
                    <>
                      <span className="font-medium mr-1">{stats.count}</span>
                      <span className="mr-2">{stats.subtitle}</span>
                    </>
                  )}
                  {stats.badge > 0 && (
                    <div className="bg-yellow-100 text-yellow-800 rounded-full px-2 py-1">
                      {stats.badge} {stats.badgeLabel}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 pt-0">
              <NavLink
                to={to}
                className={`inline-block w-full text-center px-4 py-2 text-sm font-semibold rounded-full text-white bg-gray-800 hover:bg-gray-900 transition duration-300`}
              >
                Go to {title}
              </NavLink>
            </div>
            <div className={`h-1 bg-gradient-to-r ${color}`}></div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">📈 Booking Trends</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold text-green-600">
                  +{bookingStats.totalBookings || 0} bookings
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Reviews</span>
                <span className="font-semibold text-yellow-600">
                  {bookingStats.pendingApprovals || 0} awaiting
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue Growth</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(bookingStats.totalRevenue || 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300"></div>
        </Card>

        <Card className="shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">⚡ Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <NavLink
                to="/admin/bookings"
                className="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center"
              >
                <div className="text-indigo-600 font-medium">📅</div>
                <div className="text-sm mt-1">View Bookings</div>
              </NavLink>
              <NavLink
                to="/admin/invoices"
                className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
              >
                <div className="text-green-600 font-medium">📄</div>
                <div className="text-sm mt-1">Manage Invoices</div>
              </NavLink>
              <NavLink
                to="/admin/users"
                className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
              >
                <div className="text-purple-600 font-medium">👥</div>
                <div className="text-sm mt-1">User Management</div>
              </NavLink>
              <NavLink
                to="/admin/reports"
                className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center"
              >
                <div className="text-orange-600 font-medium">📊</div>
                <div className="text-sm mt-1">View Reports</div>
              </NavLink>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300"></div>
        </Card>
      </div>
    </div>
  );
}