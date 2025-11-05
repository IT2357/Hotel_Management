import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
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
  Truck,
  Star,
  MessageSquare,
  Flag,
  EyeOff,
  Eye as EyeIcon,
  RotateCcw,
  Printer,
  Phone,
  Mail
} from 'lucide-react';
import FoodButton from '../../../../components/food/FoodButton';
import FoodInput from '../../../../components/food/FoodInput';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/food/FoodCard';
import FoodBadge from '../../../../components/food/FoodBadge';
import FoodSelect from '../../../../components/food/FoodSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/food/FoodDialog';
import FoodLabel from '../../../../components/food/FoodLabel';
import FoodTextarea from '../../../../components/food/FoodTextarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/food/FoodTabs';
import { toast } from 'sonner';
import api from '../../../../services/api';

// Aliases for consistent naming
const Button = FoodButton;
const Input = FoodInput;
const Badge = FoodBadge;
const Label = FoodLabel;
const Textarea = FoodTextarea;

const FoodOrderManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewFilters, setReviewFilters] = useState({
    status: 'all',
    flagged: 'all'
  });
  
  const queryClient = useQueryClient();

  // Yup validation schema
  const orderFormSchema = Yup.object().shape({
    status: Yup.string().required('Status is required'),
    notes: Yup.string()
  });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: yupResolver(orderFormSchema),
    defaultValues: {
      status: '',
      notes: ''
    }
  });

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Preparing', label: 'Preparing' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  // Helper to normalize status (handles both lowercase and capitalized)
  const normalizeStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const statusColors = {
    Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Preparing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    preparing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const statusIcons = {
    Pending: AlertCircle,
    Preparing: ChefHat,
    Delivered: CheckCircle,
    Cancelled: XCircle,
    pending: AlertCircle,
    preparing: ChefHat,
    delivered: CheckCircle,
    cancelled: XCircle
  };

  // React Query for fetching orders
  const { data: ordersData, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useQuery({
    queryKey: ['orders', selectedStatus, selectedDate, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedDate) params.append('date', selectedDate);
      
      const response = await api.get(`/food/orders?${params}`);
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });

  // React Query for fetching order stats
  const { data: orderStats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['orderStats'],
    queryFn: async () => {
      const response = await api.get('/food/orders/stats');
      return response.data.data;
    },
    staleTime: 60000 // 1 minute
  });

  // React Query for fetching reviews
  const { data: reviewsData, isLoading: reviewsLoading, isError: reviewsError, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', reviewFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (reviewFilters.status !== 'all') params.append('status', reviewFilters.status);
      if (reviewFilters.flagged !== 'all') params.append('flagged', reviewFilters.flagged);

      const response = await api.get(`/food/reviews?${params}`);
      return response.data.data;
    },
    staleTime: 30000 // 30 seconds
  });

  // React Query for fetching review stats
  const { data: reviewStats, isLoading: reviewStatsLoading, isError: reviewStatsError, refetch: refetchReviewStats } = useQuery({
    queryKey: ['reviewStats'],
    queryFn: async () => {
      const response = await api.get('/food/reviews/stats');
      return response.data.data;
    },
    staleTime: 60000 // 1 minute
  });

  // Mutation for updating order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }) => {
      const response = await api.put(`/food/orders/${orderId}/status`, { status, notes });
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['orderStats']);
      
      // Close the dialog after successful update
      setIsOrderDialogOpen(false);
      
      toast.success('Order status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  });

  // Mutation for moderating reviews
  const moderateReviewMutation = useMutation({
    mutationFn: async ({ orderId, updates }) => {
      const response = await api.put(`/food/orders/${orderId}/reviews/moderate`, updates);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate review queries
      queryClient.invalidateQueries(['reviews']);
      queryClient.invalidateQueries(['reviewStats']);
      
      toast.success('Review moderation updated');
    },
    onError: (error) => {
      console.error('Error moderating review:', error);
      toast.error('Failed to moderate review');
    }
  });

  // Helper function to print order details
  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank');
    const orderDetails = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order._id.slice(-8)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Order #${order._id.slice(-8)}</h1>
        <p><strong>Customer:</strong> ${order.userId?.name || order.customerDetails?.name || 'Unknown'}</p>
        <p><strong>Email:</strong> ${order.userId?.email || order.customerDetails?.email || 'No email'}</p>
        <p><strong>Phone:</strong> ${order.customerDetails?.phone || 'No phone'}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        ${order.scheduledTime ? `<p><strong>Scheduled Time:</strong> ${new Date(order.scheduledTime).toLocaleString()}</p>` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td>${item.foodId?.name || 'Unknown Item'}</td>
                <td>${item.quantity}</td>
                <td>LKR ${(item.foodId?.price || 0).toFixed(2)}</td>
                <td>LKR ${((item.foodId?.price || 0) * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <p class="total">Total Amount: LKR ${(order.totalPrice || 0).toFixed(2)}</p>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(orderDetails);
    printWindow.document.close();
  };

  // Helper function to contact customer
  const handleContactCustomer = (order) => {
    const email = order.userId?.email || order.customerDetails?.email;
    const phone = order.customerDetails?.phone;
    
    if (email) {
      window.location.href = `mailto:${email}?subject=Regarding Order #${order._id.slice(-8)}`;
    } else if (phone) {
      toast.info(`Customer Phone: ${phone}`);
    } else {
      toast.error('No contact information available');
    }
  };

  const handleReviewModeration = async (orderId, updates) => {
    try {
      await moderateReviewMutation.mutateAsync({ orderId, updates });
    } catch (error) {
      console.error('Error moderating review:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatusMutation.mutateAsync({ orderId, status: newStatus });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const openOrderDialog = (order) => {
    setSelectedOrder(order);
    // Set form values when opening dialog
    setValue('status', order.status);
    setValue('notes', order.notes || '');
    setIsOrderDialogOpen(true);
  };

  const filteredOrders = ordersData?.filter(order => {
    const customerName = order.userId?.name || order.customerDetails?.name || '';
    const customerEmail = order.userId?.email || order.customerDetails?.email || '';
    const orderId = order._id || '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         orderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle form submission
  const onSubmit = async (values) => {
    if (selectedOrder) {
      try {
        await updateOrderStatusMutation.mutateAsync({
          orderId: selectedOrder._id,
          ...values
        });
        reset();
      } catch (error) {
        console.error('Error updating order:', error);
      }
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Food Order{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor and manage food orders across your restaurant
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                      <p className="text-3xl font-bold">{orderStats?.totalOrders || 0}</p>
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
                      <p className="text-3xl font-bold">{orderStats?.todayOrders || 0}</p>
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
                      <p className="text-3xl font-bold">{orderStats?.pendingOrders || 0}</p>
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
                      <p className="text-3xl font-bold">{orderStats?.completedOrders || 0}</p>
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
                      <p className="text-3xl font-bold">LKR {(orderStats?.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-emerald-500/20 rounded-full">
                      <DollarSign className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders by customer name, email, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <FoodSelect 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full md:w-48"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FoodSelect>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full md:w-48"
              />
              <Button
                onClick={() => refetchOrders()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {ordersLoading ? (
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
                  const StatusIcon = statusIcons[order.status] || AlertCircle; // Fallback to AlertCircle
                  const normalizedStatus = normalizeStatus(order.status);
                  return (
                    <div key={order._id}>
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
                                    <span>{order.userId?.name || order.customerDetails?.name || 'Unknown Customer'}</span>
                                    <span>•</span>
                                    <span>{order.userId?.email || order.customerDetails?.email || 'No email'}</span>
                                  </div>
                                </div>
                                <Badge className={statusColors[order.status] || statusColors.Pending}>
                                  <StatusIcon className="h-4 w-4 mr-1" />
                                  {normalizedStatus}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Items</p>
                                  <p className="font-semibold">{order.items?.length || 0} items</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Amount</p>
                                  <p className="font-semibold text-green-600">LKR {order.totalPrice?.toFixed(2) || '0.00'}</p>
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
                              
                              {/* Print Order button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintOrder(order)}
                                className="flex items-center gap-2"
                              >
                                <Printer className="h-4 w-4" />
                                Print
                              </Button>

                              {/* Contact Customer button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContactCustomer(order)}
                                className="flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                Contact
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
                    </div>
                  );
                })
              )}
            </div>

            {filteredOrders.length === 0 && !ordersLoading && (
              <div className="text-center py-16">
                <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedStatus !== 'all' || selectedDate
                    ? 'Try adjusting your search or filter criteria'
                    : 'No food orders have been placed yet'
                  }
                </p>
              </div>
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
                        <p className="font-semibold text-green-600">LKR {selectedOrder.totalPrice?.toFixed(2) || '0.00'}</p>
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
                              <p className="font-semibold">LKR {((item.foodId?.price || 0) * item.quantity).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">LKR {item.foodId?.price || 0} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Update Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="status">Update Status</Label>
                        <FoodSelect
                          id="status"
                          {...register('status')}
                          className={errors.status ? 'border-red-500' : ''}
                        >
                          <option value="">Select Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </FoodSelect>
                        {errors.status && (
                          <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          {...register('notes')}
                          rows={3}
                          placeholder="Add any notes about this status update..."
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={updateOrderStatusMutation.isLoading}
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                        >
                          {updateOrderStatusMutation.isLoading ? 'Updating...' : 'Update Status'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsOrderDialogOpen(false)}
                          className="flex-1"
                        >
                          Close
                        </Button>
                      </div>
                    </form>
                    
                    {/* Admin action buttons in dialog */}
                    <div className="pt-4 flex gap-3">
                      <Button
                        onClick={() => handlePrintOrder(selectedOrder)}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Print Order
                      </Button>
                      <Button
                        onClick={() => handleContactCustomer(selectedOrder)}
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Contact Customer
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="reviews">
            {/* Review Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Reviews</p>
                      <p className="text-3xl font-bold">{reviewStats?.totalReviews || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-full">
                      <MessageSquare className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Average Rating</p>
                      <p className="text-3xl font-bold">{reviewStats?.averageRating?.toFixed(1) || '0.0'}</p>
                    </div>
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Visible Reviews</p>
                      <p className="text-3xl font-bold">{reviewStats?.visibleReviews || 0}</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-full">
                      <EyeIcon className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Flagged Reviews</p>
                      <p className="text-3xl font-bold">{reviewStats?.flaggedReviews || 0}</p>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded-full">
                      <Flag className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Rating Distribution</p>
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="flex items-center gap-2 text-xs">
                          <span className="w-3">{rating}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{
                                width: `${reviewStats?.totalReviews > 0
                                  ? (reviewStats?.ratingDistribution?.[rating] / reviewStats?.totalReviews) * 100
                                  : 0}%`
                              }}
                            />
                          </div>
                          <span className="w-6 text-right">{reviewStats?.ratingDistribution?.[rating] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Review Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <FoodSelect 
                value={reviewFilters.status}
                onChange={(e) => setReviewFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full md:w-48"
              >
                <option value="all">All Reviews</option>
                <option value="visible">Visible Only</option>
                <option value="hidden">Hidden Only</option>
              </FoodSelect>

              <FoodSelect 
                value={reviewFilters.flagged}
                onChange={(e) => setReviewFilters(prev => ({ ...prev, flagged: e.target.value }))}
                className="w-full md:w-48"
              >
                <option value="all">All Reviews</option>
                <option value="true">Flagged Only</option>
                <option value="false">Not Flagged</option>
              </FoodSelect>
              
              <Button
                onClick={() => refetchReviews()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : reviewsData?.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-2">No reviews found</h3>
                  <p className="text-muted-foreground">
                    {reviewFilters.status !== 'all' || reviewFilters.flagged !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No reviews have been submitted yet'
                    }
                  </p>
                </div>
              ) : (
                reviewsData?.map((order, index) => (
                  <div key={order._id}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  Order #{order._id.slice(-8)}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  <span>{order.customerDetails?.name || 'Unknown Customer'}</span>
                                  <span>•</span>
                                  <span>{order.customerDetails?.email || 'No email'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < order.review.rating
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm font-medium ml-2">
                                  {order.review.rating}/5
                                </span>
                              </div>
                            </div>

                            {order.review.comment && (
                              <div className="mb-4">
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                  "{order.review.comment}"
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Order Total: LKR {order.totalPrice?.toFixed(2)}</span>
                              <span>•</span>
                              <span>Reviewed: {formatDate(order.review.submittedAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewModeration(order._id, {
                                isVisible: !order.review.isVisible
                              })}
                              className={order.review.isVisible ? 'text-green-600' : 'text-gray-600'}
                            >
                              {order.review.isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewModeration(order._id, {
                                flagged: !order.review.flagged
                              })}
                              className={order.review.flagged ? 'text-red-600' : 'text-gray-600'}
                            >
                              <Flag className={`w-4 h-4 ${order.review.flagged ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FoodOrderManagementPage;