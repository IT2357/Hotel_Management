import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import useAuth from "../../hooks/useAuth";
import staffAPI from "../../services/staffAPI";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function StaffDashboardPage() {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getDashboardData();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching staff dashboard data:', err);
      // Set default data in case of error
      setDashboardData({
        myBookings: 0,
        roomStatus: { available: 0, occupied: 0, maintenance: 0 },
        supportRequests: 0,
        tasks: { pending: 0, completed: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            Staff Dashboard
          </h1>
          <button
            onClick={logout}
            className="px-6 py-2 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition duration-300 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r h-screen px-6 py-8">
          <nav className="space-y-4">
            {[
              { label: "Dashboard", path: "/staff-portal" },
              { label: "My Bookings", path: "/staff/bookings" },
              { label: "Room Status", path: "/staff/rooms" },
              { label: "Guest Check-ins", path: "/staff/checkins" },
              { label: "Support Requests", path: "/staff/support" }
            ].map(({ label, path }) => (
              <a
                key={label}
                href={path}
                className="block text-lg font-medium text-gray-700 hover:text-indigo-600 transition duration-200"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Welcome, {user?.name?.split(" ")[0]} 👋
            </h2>
            <button 
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-700">
                  {error} - Showing default values
                </span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-4" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  title: "My Bookings",
                  to: "/staff/bookings",
                  description: "View and manage your assigned bookings.",
                  count: dashboardData?.myBookings || 0
                },
                {
                  title: "Room Status",
                  to: "/staff/rooms",
                  description: "Check availability and maintenance status.",
                  count: `${dashboardData?.roomStatus?.available || 0} available`
                },
                {
                  title: "Support Requests",
                  to: "/staff/support",
                  description: "Respond to guest issues and internal tasks.",
                  count: dashboardData?.supportRequests || 0
                }
              ].map(({ title, description, to, count }) => (
                <DashboardCard key={title} title={title} description={description} to={to} count={count} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, to, count }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition duration-300">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {count !== undefined && (
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <a
        href={to}
        className="inline-block px-4 py-1 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 transition duration-300"
      >
        Go to {title}
      </a>
    </div>
  );
}
