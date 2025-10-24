import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Utensils, 
  ShoppingCart, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Eye,
  IndianRupee,
  Users,
  Star,
  Package,
  ChefHat,
  AlertCircle
} from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';
import FoodInput from '../../../components/food/FoodInput';
import FoodSelect from '../../../components/food/FoodSelect';
import FoodTextarea from '../../../components/food/FoodTextarea';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('menus');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data for menus
  const { data: menus = [], isLoading: menusLoading } = useQuery({
    queryKey: ['adminMenus'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      return [
        {
          _id: 'menu-1',
          name: 'Jaffna Chicken Curry',
          description: 'Traditional Jaffna-style chicken curry with authentic spices',
          price: 450,
          category: 'Main Course',
          isAvailable: true,
          isVeg: false,
          isSpicy: true,
          image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=200',
          createdAt: '2025-10-01T10:00:00Z'
        },
        {
          _id: 'menu-2',
          name: 'Seafood Kottu',
          description: 'Fresh seafood mixed with crispy kottu roti',
          price: 650,
          category: 'Main Course',
          isAvailable: true,
          isVeg: false,
          isSpicy: true,
          image: 'https://images.unsplash.com/photo-1625938140777-f0b5d5d7c0d7?w=200',
          createdAt: '2025-10-05T14:30:00Z'
        },
        {
          _id: 'menu-3',
          name: 'Vegetable Kool',
          description: 'Nutritious vegetable soup with traditional flavors',
          price: 250,
          category: 'Soups',
          isAvailable: false,
          isVeg: true,
          isSpicy: false,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
          createdAt: '2025-10-10T09:15:00Z'
        }
      ];
    }
  });

  // Mock data for orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock data
      return [
        {
          _id: 'order-1',
          orderNumber: 'ORD-2025-001',
          customerName: 'John Doe',
          items: [
            { name: 'Jaffna Chicken Curry', quantity: 2, price: 450 },
            { name: 'Mutton Kola Urundai', quantity: 1, price: 350 }
          ],
          total: 1250,
          status: 'delivered',
          date: '2025-10-20T12:30:00Z',
          orderType: 'dine-in'
        },
        {
          _id: 'order-2',
          orderNumber: 'ORD-2025-002',
          customerName: 'Jane Smith',
          items: [
            { name: 'Seafood Kottu', quantity: 1, price: 650 }
          ],
          total: 650,
          status: 'preparing',
          date: '2025-10-21T19:15:00Z',
          orderType: 'takeaway'
        }
      ];
    }
  });

  // Mock data for offers
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['adminOffers'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      return [
        {
          _id: 'offer-1',
          title: 'Seafood Lover\'s Special',
          description: '20% off on all seafood dishes',
          type: 'percentage',
          discountValue: 20,
          target: { minOrders: 3 },
          startDate: '2025-10-01T00:00:00Z',
          endDate: '2025-12-31T23:59:59Z',
          isActive: true,
          redemptions: 15
        },
        {
          _id: 'offer-2',
          title: 'Weekend Special',
          description: 'Free dessert with orders over LKR 1000',
          type: 'free_item',
          discountValue: 0,
          target: { minOrders: 1 },
          startDate: '2025-10-15T00:00:00Z',
          endDate: '2025-11-15T23:59:59Z',
          isActive: true,
          redemptions: 8
        }
      ];
    }
  });

  // Mock analytics data
  const analyticsData = {
    totalRevenue: 125000,
    totalOrders: 342,
    avgOrderValue: 365.50,
    popularItems: [
      { name: 'Jaffna Chicken Curry', orders: 45 },
      { name: 'Seafood Kottu', orders: 38 },
      { name: 'Mutton Kola Urundai', orders: 32 }
    ]
  };

  // Filter menus based on search and filter
  const filteredMenus = menus.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         menu.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'available' && menu.isAvailable) ||
                         (filterStatus === 'unavailable' && !menu.isAvailable);
    return matchesSearch && matchesFilter;
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Pending</span>;
      case 'confirmed':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Confirmed</span>;
      case 'preparing':
        return <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Preparing</span>;
      case 'ready':
        return <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Ready</span>;
      case 'delivered':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Delivered</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Food Management Dashboard</h1>
        <FoodButton
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New
        </FoodButton>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">LKR {analyticsData.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">LKR {analyticsData.avgOrderValue}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Utensils className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Menus</p>
              <p className="text-2xl font-bold text-gray-900">{menus.filter(m => m.isAvailable).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'menus', name: 'Menus', icon: Utensils },
              { id: 'orders', name: 'Orders', icon: ShoppingCart },
              { id: 'offers', name: 'Offers', icon: Star },
              { id: 'analytics', name: 'Analytics', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'menus' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search menus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <FoodSelect
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: 'Available' },
                    { value: 'unavailable', label: 'Unavailable' }
                  ]}
                />
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Menu Item
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMenus.map((menu) => (
                      <tr key={menu._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-md object-cover" src={menu.image} alt={menu.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{menu.name}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{menu.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{menu.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">LKR {menu.price}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {menu.isAvailable ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Available
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Unavailable
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(menu.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">LKR {order.total}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {offers.map((offer) => (
                  <div key={offer._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{offer.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        offer.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type</span>
                        <span className="font-medium">
                          {offer.type === 'percentage' && `${offer.discountValue}% off`}
                          {offer.type === 'fixed_amount' && `LKR ${offer.discountValue} off`}
                          {offer.type === 'free_item' && 'Free item'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Target</span>
                        <span className="font-medium">{offer.target.minOrders}+ orders</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Validity</span>
                        <span className="font-medium">
                          {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Redemptions</span>
                        <span className="font-medium">{offer.redemptions}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6">
                      <FoodButton
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </FoodButton>
                      <FoodButton
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </FoodButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Menu Items</h3>
                  <div className="space-y-4">
                    {analyticsData.popularItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-orange-600">#{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {item.orders} orders
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">This Week</span>
                      <span className="font-bold text-gray-900">LKR 24,500</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">This Month</span>
                      <span className="font-bold text-gray-900">LKR 98,750</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">This Year</span>
                      <span className="font-bold text-gray-900">LKR 1,250,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;