import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NavLink } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { X } from 'lucide-react';

export default function FoodManagementPage() {
  const { user } = useContext(AuthContext);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Mock data for charts
  const orderTrendsData = [
    { month: 'Jan', orders: 120 },
    { month: 'Feb', orders: 150 },
    { month: 'Mar', orders: 180 },
    { month: 'Apr', orders: 200 },
    { month: 'May', orders: 220 },
    { month: 'Jun', orders: 250 },
  ];

  const menuPerformanceData = [
    { item: 'Pizza', sales: 300 },
    { item: 'Burger', sales: 250 },
    { item: 'Pasta', sales: 200 },
    { item: 'Salad', sales: 150 },
    { item: 'Dessert', sales: 100 },
  ];

  const aiRecommendationsData = [
    { name: 'Recommended', value: 60, color: '#8884d8' },
    { name: 'Not Recommended', value: 40, color: '#82ca9d' },
  ];

  const recentOrders = [
    { id: 1, customer: 'John Doe', item: 'Pizza', status: 'Delivered', amount: 25, details: { quantity: 2, specialInstructions: 'Extra cheese', time: '2023-09-23 12:30' } },
    { id: 2, customer: 'Jane Smith', item: 'Burger', status: 'Preparing', amount: 15, details: { quantity: 1, specialInstructions: 'No onions', time: '2023-09-23 13:15' } },
    { id: 3, customer: 'Bob Johnson', item: 'Pasta', status: 'Pending', amount: 20, details: { quantity: 1, specialInstructions: 'Gluten-free', time: '2023-09-23 14:00' } },
  ];

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
          Food Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name?.split(" ")[0] || "Admin"}! Here's your food management analytics and overview.
        </p>
      </div>

      {/* Food Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Orders" value="1,234" change="+12%" icon="📦" />
        <StatCard title="Revenue" value="$12,345" change="+8%" icon="💰" />
        <StatCard title="Active Menus" value="45" change="+5%" icon="🍽️" />
        <StatCard title="AI Recommendations" value="89%" change="+3%" icon="🤖" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4">Order Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orderTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4">Menu Performance</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={menuPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="item" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations Pie Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h4 className="text-lg font-semibold mb-4">AI Menu Recommendations</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={aiRecommendationsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {aiRecommendationsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h4 className="text-lg font-semibold mb-4">Recent Orders</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Order ID</th>
                <th className="text-left py-2">Customer</th>
                <th className="text-left py-2">Item</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2">#{order.id}</td>
                  <td className="py-2">{order.customer}</td>
                  <td className="py-2">{order.item}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2">${order.amount}</td>
                  <td className="py-2">
                    <button onClick={() => handleViewOrder(order)} className="text-indigo-600 hover:text-indigo-800 mr-2">View</button>
                    <button className="text-green-600 hover:text-green-800">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex space-x-4">
          <NavLink to="/admin/food/orders" className="text-indigo-600 hover:text-indigo-800">
            View All Orders →
          </NavLink>
          <NavLink to="/admin/food/menu" className="text-green-600 hover:text-green-800">
            Manage Food Menu →
          </NavLink>
          <NavLink to="/admin/menu-upload" className="text-purple-600 hover:text-purple-800">
            AI Menu Generator →
          </NavLink>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Order ID:</span> #{selectedOrder.id}
              </div>
              <div>
                <span className="font-medium">Customer:</span> {selectedOrder.customer}
              </div>
              <div>
                <span className="font-medium">Item:</span> {selectedOrder.item}
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {selectedOrder.details.quantity}
              </div>
              <div>
                <span className="font-medium">Special Instructions:</span> {selectedOrder.details.specialInstructions}
              </div>
              <div>
                <span className="font-medium">Order Time:</span> {selectedOrder.details.time}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                  selectedOrder.status === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Total Amount:</span> ${selectedOrder.amount}
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex-1">
                Update Status
              </button>
              <button onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ title, value, change, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm text-green-600">{change} from last month</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}