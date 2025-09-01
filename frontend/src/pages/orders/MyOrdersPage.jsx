import { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Mail, ChefHat, Star, Calendar, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth.jsx';
import axios from 'axios';

const MyOrdersPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch real orders data
  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      // Try to get customer email from localStorage (from recent orders)
      
      let customerEmail = null;
      
      // Priority 1: Use authenticated user's email
      if (isAuthenticated && user?.email) {
        customerEmail = user.email;
      } else {
        // Priority 2: Get from localStorage for guest orders
        customerEmail = localStorage.getItem('customerEmail');
      }
      
      if (!customerEmail) {
        // Fallback to demo data if no email found
        setOrders(demoOrders);
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/orders/customer/${customerEmail}?status=${filter}`);
      
      if (response.data.success && response.data.data.length > 0) {
        // Transform API data to match frontend structure (keep numeric totals)
        const transformedOrders = response.data.data.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          date: new Date(order.createdAt).toLocaleDateString(),
          time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: order.status,
          total: Number(order.total || 0),
          subtotal: Number(order.subtotal || 0),
          tax: Number(order.tax || 0),
          serviceCharge: Number(order.serviceCharge || 0),
          items: (order.items || []).map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price || 0),
            portion: item.selectedPortion
          })),
          customerInfo: order.customerInfo,
          orderType: order.orderType,
          tableNumber: order.tableNumber,
          estimatedTime: '25-30 minutes'
        }));

        setOrders(transformedOrders);
      } else {
        // Show demo orders if no real orders found
        setOrders(demoOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to demo orders on error
      setOrders(demoOrders);
    } finally {
      setLoading(false);
    }
  };

  // Demo orders data
  const demoOrders = [
    {
      id: 'CC20250820001',
      orderNumber: 'CC20250820001',
      status: 'confirmed',
      orderType: 'dine-in',
      tableNumber: 'T-12',
      items: [
        {
          name: 'Bamboo Biriyani (Chicken)',
          quantity: 1,
          price: 1950,
          portion: null
        },
        {
          name: 'Culture Special Chicken Kottu',
          quantity: 1,
          price: 2750,
          portion: null
        }
      ],
      subtotal: 4700,
      tax: 588,
      serviceCharge: 470,
      total: 5758,
      customerInfo: {
        name: 'John Doe',
        phone: '+94 77 123 4567',
        email: 'john@example.com'
      },
      createdAt: new Date('2025-08-20T10:30:00'),
      estimatedTime: '25-30 minutes',
      specialInstructions: 'Medium spice level please'
    },
    {
      id: 'CC20250819002',
      orderNumber: 'CC20250819002',
      status: 'preparing',
      orderType: 'takeaway',
      tableNumber: null,
      items: [
        {
          name: 'Mixed Seafood Dry Curry Bowl (W/Roast Bread)',
          quantity: 1,
          price: 4550,
          portion: 'Half'
        },
        {
          name: 'Fresh King Coconut Water',
          quantity: 2,
          price: 775,
          portion: null
        }
      ],
      subtotal: 6100,
      tax: 763,
      serviceCharge: 610,
      total: 7473,
      customerInfo: {
        name: 'Jane Smith',
        phone: '+94 71 987 6543',
        email: 'jane@example.com'
      },
      createdAt: new Date('2025-08-19T18:45:00'),
      estimatedTime: '15-20 minutes',
      specialInstructions: null
    },
    {
      id: 'CC20250818003',
      orderNumber: 'CC20250818003',
      status: 'completed',
      orderType: 'dine-in',
      tableNumber: 'T-05',
      items: [
        {
          name: 'Kukulmas Yapanaya Kramayata (Jaffna Style)',
          quantity: 2,
          price: 1750,
          portion: null
        },
        {
          name: 'Watalappan',
          quantity: 2,
          price: 925,
          portion: null
        }
      ],
      subtotal: 5350,
      tax: 669,
      serviceCharge: 535,
      total: 6554,
      customerInfo: {
        name: 'Mike Johnson',
        phone: '+94 76 555 1234',
        email: 'mike@example.com'
      },
      createdAt: new Date('2025-08-18T19:20:00'),
      estimatedTime: 'Completed',
      specialInstructions: 'Extra spicy, please add extra chili'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-blue-400 bg-blue-900/20';
      case 'preparing': return 'text-yellow-400 bg-yellow-900/20';
      case 'ready': return 'text-green-400 bg-green-900/20';
      case 'completed': return 'text-green-400 bg-green-900/20';
      case 'cancelled': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'preparing': return <Clock className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">My Food Orders</h1>
              <p className="text-gray-400 mt-1">Track your VALDOR orders</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/dashboard" className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm">Dashboard</a>
              <a href="/menu" className="px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold">Menu</a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
            { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
            { key: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
            { key: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg transition duration-300 ${
                filter === tab.key
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">#{order.orderNumber}</h3>
                    <p className="text-gray-400 text-sm flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </div>
                </div>

                {/* Order Type & Table */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="capitalize">{order.orderType}</span>
                    {order.tableNumber && <span className="ml-1">- {order.tableNumber}</span>}
                  </div>
                  {order.estimatedTime && (
                    <div className="flex items-center text-yellow-400">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{order.estimatedTime}</span>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="text-gray-300">
                          <span>{item.quantity}x {item.name}</span>
                          {item.portion && <span className="text-gray-500"> ({item.portion})</span>}
                        </div>
                        <span className="text-yellow-400 font-semibold">LKR {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-1">Special Instructions:</h4>
                    <p className="text-gray-400 text-sm italic">{order.specialInstructions}</p>
                  </div>
                )}

                {/* Order Total */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-yellow-400 font-bold text-lg">LKR {order.total}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full bg-yellow-400 text-black py-2 rounded-lg hover:bg-yellow-500 transition duration-300 font-semibold flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? "You haven't placed any orders yet. Visit our menu to get started!"
                : `No ${filter} orders found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedOrder(null)}></div>
            <div className="relative bg-gray-900 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Order Details</h2>
                    <p className="text-gray-400">#{selectedOrder.orderNumber}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    ✕
                  </button>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Customer Information</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Name</p>
                        <p className="text-white font-semibold">{selectedOrder.customerInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Phone</p>
                        <p className="text-white font-semibold flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {selectedOrder.customerInfo.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-semibold">{item.name}</p>
                            {item.portion && <p className="text-gray-400 text-sm">Portion: {item.portion}</p>}
                            <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                          </div>
                          <p className="text-yellow-400 font-bold">LKR {item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-700 mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-300">
                        <span>Subtotal:</span>
                        <span>LKR {selectedOrder.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Tax (12.5%):</span>
                        <span>LKR {selectedOrder.tax}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Service Charge (10%):</span>
                        <span>LKR {selectedOrder.serviceCharge}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2">
                        <span>Total:</span>
                        <span className="text-yellow-400">LKR {selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-2 capitalize">{selectedOrder.status}</span>
                  </div>
                  {selectedOrder.estimatedTime && selectedOrder.status !== 'completed' && (
                    <p className="text-gray-400 mt-2">Estimated time: {selectedOrder.estimatedTime}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
