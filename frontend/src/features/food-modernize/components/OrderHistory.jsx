import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  ChefHat, 
  Repeat,
  Star,
  IndianRupee,
  Calendar,
  Users
} from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';
import { useCart } from '../../../context/CartContext';

const OrderHistory = () => {
  const { addToCart, getItemCount } = useCart();
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Mock data for order history
  // In a real implementation, this would come from an API
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orderHistory'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      return [
        {
          _id: 'order-1',
          orderNumber: 'ORD-2025-001',
          items: [
            { name: 'Jaffna Chicken Curry', quantity: 2, price: 450 },
            { name: 'Mutton Kola Urundai', quantity: 1, price: 350 },
            { name: 'Vegetable Kool', quantity: 1, price: 250 }
          ],
          total: 1500,
          status: 'delivered',
          date: '2025-10-20T12:30:00Z',
          orderType: 'dine-in'
        },
        {
          _id: 'order-2',
          orderNumber: 'ORD-2025-002',
          items: [
            { name: 'Seafood Kottu', quantity: 1, price: 650 },
            { name: 'Prawn Curry', quantity: 1, price: 550 }
          ],
          total: 1200,
          status: 'confirmed',
          date: '2025-10-21T19:15:00Z',
          orderType: 'takeaway'
        },
        {
          _id: 'order-3',
          orderNumber: 'ORD-2025-003',
          items: [
            { name: 'Crab Curry', quantity: 1, price: 750 },
            { name: 'Basmati Rice', quantity: 2, price: 150 },
            { name: 'Fresh Lime Juice', quantity: 2, price: 80 }
          ],
          total: 1360,
          status: 'preparing',
          date: '2025-10-22T13:45:00Z',
          orderType: 'dine-in'
        }
      ];
    }
  });

  // Mock data for personalized offers
  const { data: offers = [] } = useQuery({
    queryKey: ['personalizedOffers'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - in a real implementation, this would be based on order history
      return [
        {
          _id: 'offer-1',
          title: 'Seafood Lover\'s Special',
          description: '20% off on all seafood dishes',
          discount: '20%',
          code: 'SEAFOOD20',
          minOrders: 3,
          userOrders: 5
        },
        {
          _id: 'offer-2',
          title: 'Curry Connoisseur Deal',
          description: '15% off on all curry dishes',
          discount: '15%',
          code: 'CURRY15',
          minOrders: 3,
          userOrders: 4
        }
      ];
    }
  });

  // Handle reorder
  const handleReorder = (order) => {
    // Add all items from the order to the cart
    order.items.forEach(item => {
      // In a real implementation, we would have the full item object
      // For now, we'll create a mock item
      const mockItem = {
        _id: `item-${Date.now()}-${Math.random()}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        description: `Reordered from order ${order.orderNumber}`,
        isVeg: item.name.toLowerCase().includes('vegetable'),
        isSpicy: item.name.toLowerCase().includes('kola') || item.name.toLowerCase().includes('curry')
      };
      
      // Add to cart multiple times based on quantity
      for (let i = 0; i < item.quantity; i++) {
        addToCart(mockItem);
      }
    });
    
    // Show success message
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-right duration-300';
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <span class="font-medium">Order items added to cart!</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100' };
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'preparing':
        return { icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-100' };
      case 'ready':
        return { icon: Package, color: 'text-purple-500', bg: 'bg-purple-100' };
      case 'delivered':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading order history: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>{orders.length} orders</span>
        </div>
      </div>

      {/* Personalized Offers */}
      {offers.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-bold text-gray-800">Special Offers Just for You</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <div key={offer._id} className="bg-white rounded-xl p-4 border border-orange-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-gray-800">{offer.title}</h4>
                    <p className="text-sm text-gray-600">{offer.description}</p>
                  </div>
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {offer.discount} OFF
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    {offer.userOrders} of {offer.minOrders} orders completed
                  </div>
                  <FoodButton
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Apply
                  </FoodButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
          <p className="text-gray-500">Start ordering to see your history here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const StatusIcon = getStatusInfo(order.status).icon;
            const statusColor = getStatusInfo(order.status).color;
            const statusBg = getStatusInfo(order.status).bg;
            
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{order.orderNumber}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusBg} ${statusColor}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          <span className="font-semibold">{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {order.orderType === 'dine-in' ? (
                            <ChefHat className="w-4 h-4" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                          <span className="capitalize">{order.orderType}</span>
                        </div>
                      </div>
                    </div>
                    
                    <FoodButton
                      onClick={() => handleReorder(order)}
                      size="sm"
                      className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 py-2 rounded-lg"
                    >
                      <Repeat className="w-4 h-4" />
                      Reorder
                    </FoodButton>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="p-5">
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-gray-800">{item.name}</div>
                            <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-800">
                            LKR {(item.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            LKR {item.price.toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;