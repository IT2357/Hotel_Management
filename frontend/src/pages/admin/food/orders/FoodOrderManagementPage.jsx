import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  ChefHat,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/services/api';

const FoodOrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Preparing', label: 'Preparing' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const statusColors = {
    Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Preparing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const statusIcons = {
    Pending: AlertCircle,
    Preparing: ChefHat,
    Delivered: CheckCircle,
    Cancelled: XCircle
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [selectedStatus, selectedDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedDate) params.append('date', selectedDate);

      const response = await api.get(`/food/orders?${params}`);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await api.get('/food/orders/stats');
      setOrderStats(response.data.data);
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await api.put(`/food/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order =>
        order._id === orderId ? response.data.data : order
      ));
      toast.success('Order status updated successfully');
      fetchOrderStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const openOrderDialog = (order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Food Order{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor and manage food orders across your restaurant
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{orderStats.totalOrders}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Truck className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Today's Orders</p>
                  <p className="text-3xl font-bold">{orderStats.todayOrders}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold">{orderStats.pendingOrders}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Completed Orders</p>
                  <p className="text-3xl font-bold">{orderStats.completedOrders}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold">${orderStats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-full">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders by customer name, email, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full md:w-48"
          />
        </motion.div>

        {/* Orders List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredOrders.map((order, index) => {
              const StatusIcon = statusIcons[order.status];
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">
                                Order #{order._id.slice(-8)}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{order.userId?.name || 'Unknown Customer'}</span>
                                <span>•</span>
                                <span>{order.userId?.email || 'No email'}</span>
                              </div>
                            </div>
                            <Badge className={statusColors[order.status]}>
                              <StatusIcon className="h-4 w-4 mr-1" />
                              {order.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Items</p>
                              <p className="font-semibold">{order.items?.length || 0} items</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Amount</p>
                              <p className="font-semibold text-green-600">${order.totalPrice?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Order Date</p>
                              <p className="font-semibold">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>

                          {order.scheduledTime && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground">Scheduled Time</p>
                              <p className="font-semibold">{formatDate(order.scheduledTime)}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDialog(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>

                          {order.status === 'Pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order._id, 'Preparing')}
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              Start Preparing
                            </Button>
                          )}

                          {order.status === 'Preparing' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {filteredOrders.length === 0 && !loading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl font-bold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedStatus !== 'all' || selectedDate
                ? 'Try adjusting your search or filter criteria'
                : 'No food orders have been placed yet'
              }
            </p>
          </motion.div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?._id?.slice(-8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer</Label>
                    <p className="font-semibold">{selectedOrder.userId?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.userId?.email || 'No email'}</p>
                  </div>
                  <div>
                    <Label>Order Status</Label>
                    <Badge className={statusColors[selectedOrder.status]}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <p className="font-semibold text-green-600">${selectedOrder.totalPrice?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <Label>Order Date</Label>
                    <p className="font-semibold">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                {selectedOrder.scheduledTime && (
                  <div>
                    <Label>Scheduled Time</Label>
                    <p className="font-semibold">{formatDate(selectedOrder.scheduledTime)}</p>
                  </div>
                )}

                {selectedOrder.deliveryLocation && (
                  <div>
                    <Label>Delivery Location</Label>
                    <p className="font-semibold">{selectedOrder.deliveryLocation}</p>
                  </div>
                )}

                <div>
                  <Label>Order Items</Label>
                  <div className="space-y-3 mt-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{item.foodId?.imageUrl || '🍽️'}</div>
                          <div>
                            <p className="font-semibold">{item.foodId?.name || 'Unknown Item'}</p>
                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${((item.foodId?.price || 0) * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">${item.foodId?.price || 0} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.status === 'Pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedOrder._id, 'Preparing');
                        setIsOrderDialogOpen(false);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      Start Preparing
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleStatusUpdate(selectedOrder._id, 'Cancelled');
                        setIsOrderDialogOpen(false);
                      }}
                      className="flex-1 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Cancel Order
                    </Button>
                  </div>
                )}

                {selectedOrder.status === 'Preparing' && (
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedOrder._id, 'Delivered');
                      setIsOrderDialogOpen(false);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Mark as Delivered
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FoodOrderManagementPage;