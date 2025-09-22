// src/pages/admin/AdminDashboardPage.jsx
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink } from 'react-router-dom';

export default function AdminDashboardPage() {
  const { user } = useContext(AuthContext);

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6 text-indigo-600 dark:text-indigo-400">
        Welcome, {user?.name?.split(" ")[0] || "Admin"} 👋
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Users", to: "/admin/users", description: "Manage user accounts and permissions." },
          { title: "Bookings", to: "/admin/bookings", description: "View and handle reservations." },
          { title: "Food Menu", to: "/admin/food/menu", description: "Manage restaurant menu items and AI generation." },
          { title: "Food Orders", to: "/admin/food/orders", description: "Monitor and manage food orders." },
          { title: "🤖 AI Menu Extractor", to: "/admin/menu-upload", description: "Analyze any food image like Google Lens and generate detailed menu items with AI." },
          { title: "Reports", to: "/admin/reports", description: "Analyze system performance and metrics." },
          { title: "Notifications", to: "/admin/notifications", description: "Manage system notifications and alerts." },
        ].map(({ title, description, to }) => (
          <DashboardCard key={title} title={title} description={description} to={to} />
        ))}
      </div>
    </main>
  );
}

function DashboardCard({ title, description, to }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition duration-300">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
      <NavLink
        to={to}
        className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-500 transition duration-300"
      >
        Go to {title}
      </NavLink>
    </div>
  );
}