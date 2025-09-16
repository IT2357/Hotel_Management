import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink } from "react-router-dom";
import Card from "../../components/ui/Card";

export default function AdminDashboardPage() {
  const { user } = useContext(AuthContext);

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
    },
    {
      title: "Reports",
      to: "/admin/reports",
      description: "Analyze system performance and metrics.",
      icon: "📊",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    {
      title: "Notifications",
      to: "/admin/notifications",
      description: "Manage system notifications and alerts.",
      icon: "🔔",
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
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardItems.map(({ title, description, to, icon, color }) => (
          <Card
            key={title}
            className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`${color} rounded-t-xl p-4 text-white`}>
              <h3 className="text-lg font-bold">{icon} {title}</h3>
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
    </div>
  );
}