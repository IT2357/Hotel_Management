import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import useAuth from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import { 
  FiHome, FiUsers, FiList, FiCheckSquare, 
  FiCalendar, FiClock, FiAlertTriangle, FiKey 
} from 'react-icons/fi';

export default function StaffDashboardPage() {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            Staff Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.name?.split(" ")[0]}</span>
            <button
              onClick={logout}
              className="px-6 py-2 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition duration-300 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<FiUsers className="text-2xl" />}
            value="12"
            label="Check-Ins Today"
            color="blue"
          />
          <StatCard 
            icon={<FiAlertTriangle className="text-2xl" />}
            value="5"
            label="Pending Requests"
            color="red"
          />
          <StatCard 
            icon={<FiCheckSquare className="text-2xl" />}
            value="8"
            label="Completed Tasks"
            color="green"
          />
          <StatCard 
            icon={<FiClock className="text-2xl" />}
            value="3"
            label="Upcoming Tasks"
            color="yellow"
          />
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Guest Check-In/Out",
              to: "/staff/check-in",
              description: "Manage guest arrivals and departures",
              icon: <FiUsers className="text-indigo-600" />
            },
            {
              title: "Service Requests",
              to: "/staff/service-requests",
              description: "Handle guest service requests",
              icon: <FiList className="text-indigo-600" />
            },
            {
              title: "Task Management",
              to: "/staff/tasks",
              description: "View and manage assigned tasks",
              icon: <FiCheckSquare className="text-indigo-600" />
            },
            {
              title: "Room Status",
              to: "/staff/rooms",
              description: "Check room availability and status",
              icon: <FiHome className="text-indigo-600" />
            },
            {
              title: "Key Card Management",
              to: "/staff/key-cards",
              description: "Monitor and manage key card assignments",
              icon: <FiKey className="text-indigo-600" />
            },
          ].map(({ title, description, to, icon }) => (
            <DashboardCard 
              key={title} 
              title={title} 
              description={description} 
              to={to}
              icon={icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, to, icon }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition duration-300">
      <div className="flex items-center mb-3">
        <div className="mr-3">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Link
        to={to}
        className="inline-block px-4 py-1 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 transition duration-300"
      >
        Go to {title}
      </Link>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className={`${colorClasses[color]} p-4 rounded-lg flex items-center`}>
      <div className="mr-4">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm">{label}</div>
      </div>
    </div>
  );
}