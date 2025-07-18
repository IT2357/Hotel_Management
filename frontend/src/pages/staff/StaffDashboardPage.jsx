import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import useAuth from "../../hooks/useAuth";

export default function StaffDashboardPage() {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();

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
          <h2 className="text-xl font-semibold mb-6">
            Welcome, {user?.name?.split(" ")[0]} 👋
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                title: "My Bookings",
                to: "/staff/bookings",
                description: "View and manage your assigned bookings."
              },
              {
                title: "Room Status",
                to: "/staff/rooms",
                description: "Check availability and maintenance status."
              },
              {
                title: "Support Requests",
                to: "/staff/support",
                description: "Respond to guest issues and internal tasks."
              }
            ].map(({ title, description, to }) => (
              <DashboardCard key={title} title={title} description={description} to={to} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, to }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
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
