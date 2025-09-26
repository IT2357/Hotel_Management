import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink } from "react-router-dom";
import Card from '../../components/ui/Card';

export default function AdminDashboardPage() {
  const { user } = useContext(AuthContext);
  const [bookingStats, setBookingStats] = useState({});
  const [invoiceStats, setInvoiceStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [bookingResponse, invoiceResponse] = await Promise.all([
        fetch('/api/bookings/admin/stats?period=all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/invoices/admin/stats?period=all', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const bookingData = await bookingResponse.json();
      const invoiceData = await invoiceResponse.json();

      if (bookingData.success) {
        setBookingStats(bookingData.data);
      }
      if (invoiceData.success) {
        setInvoiceStats(invoiceData.data);
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
      currency: 'LKR'
    }).format(amount);
  };

  const dashboardItems = [
    {
      title: "Users",
      to: "/admin/users",
      description: "Manage user accounts and permissions.",
      icon: "👥",
      color: "bg-gradient-to-r from-blue-500 to-indigo-500",
    },
    {
      title: "Bookings",
      to: "/admin/bookings",
      description: "View and handle reservations.",
      icon: "📅",
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
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
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      stats: {
        count: invoiceStats.totalInvoices || 0,
        subtitle: "Total invoices",
        badge: invoiceStats.paid || 0,
        badgeLabel: "Paid"
      }
    },
    {
      title: "Reports",
      to: "/admin/reports",
      description: "Analyze system performance and metrics.",
      icon: "📊",
      color: "bg-gradient-to-r from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Modern Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">👋 Welcome, {user?.name?.split(" ")[0] || "Admin"}!</h1>
            <p className="text-indigo-100 text-lg">
              Your central hub for managing the hotel system
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-lg p-4 text-center min-w-[120px]">
              <div className="text-2xl font-bold">{bookingStats.totalBookings || 0}</div>
              <div className="text-sm text-indigo-100">Total Bookings</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4 text-center min-w-[120px]">
              <div className="text-2xl font-bold">{formatCurrency(bookingStats.totalRevenue || 0)}</div>
              <div className="text-sm text-indigo-100">Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
            <h3 className="text-lg font-bold">📊 Total Bookings</h3>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-indigo-600 mb-1">
              {loading ? "..." : bookingStats.totalBookings || 0}
            </div>
            <p className="text-gray-600 text-sm">All time bookings</p>
          </div>
        </Card>

        <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-white">
            <h3 className="text-lg font-bold">⏳ Pending Approvals</h3>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {loading ? "..." : bookingStats.pendingApprovals || 0}
            </div>
            <p className="text-gray-600 text-sm">Require review</p>
          </div>
        </Card>

        <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
            <h3 className="text-lg font-bold">✅ Confirmed</h3>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {loading ? "..." : bookingStats.confirmed || 0}
            </div>
            <p className="text-gray-600 text-sm">Ready for check-in</p>
          </div>
        </Card>

        <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
            <h3 className="text-lg font-bold">💰 Revenue</h3>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {loading ? "..." : formatCurrency(bookingStats.totalRevenue || 0)}
            </div>
            <p className="text-gray-600 text-sm">Total bookings value</p>
          </div>
        </Card>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardItems.map(({ title, description, to, icon, color, stats }) => (
          <Card
            key={title}
            className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`${color} rounded-t-xl p-4 text-white relative`}>
              <h3 className="text-lg font-bold">{icon} {title}</h3>
              {stats && (
                <div className="absolute top-2 right-2 bg-white/20 rounded-full px-2 py-1">
                  <span className="text-xs font-medium">
                    {stats.count} {stats.subtitle}
                  </span>
                  {stats.badge > 0 && (
                    <div className="text-xs bg-yellow-400 text-yellow-900 rounded-full px-1 mt-1">
                      {stats.badge} {stats.badgeLabel}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">{description}</p>
              <NavLink
                to={to}
                className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-full hover:from-indigo-700 hover:to-purple-700 transition duration-300"
              >
                Go to {title}
              </NavLink>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">📈 Booking Trends</h3>
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
        </Card>

        <Card className="bg-white shadow-xl rounded-2xl border-0">
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">⚡ Quick Actions</h3>
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
        </Card>
      </div>
    </div>
  );
}