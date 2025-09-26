import React, { useState } from 'react';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Textarea from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/separator';
import { CreditCard, MapPin, User, Phone, Calendar, ShoppingBag, AlertCircle, CheckCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import foodService from '../../services/foodService';

const Checkout = ({ onClose, onOrderComplete }) => {
  const { items, total, clearCart, isTakeaway, canUseTakeaway } = useCart();
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    deliveryAddress: '',
    specialInstructions: '',
    paymentMethod: 'card'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const handleInputChange = (field, value) => {
    setOrderDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error('Please log in to place an order');
      }

      // Validate required fields
      if (!orderDetails.customerName || !orderDetails.customerEmail || !orderDetails.customerPhone) {
        throw new Error('Please fill in all required customer details');
      }

      if (!orderDetails.deliveryAddress) {
        throw new Error('Please provide delivery address or table/room information');
      }

      if (items.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          foodId: item.id || item._id,
          quantity: item.quantity
        })),
        totalPrice: total,
        isTakeaway,
        customerDetails: {
          customerName: orderDetails.customerName,
          customerEmail: orderDetails.customerEmail,
          customerPhone: orderDetails.customerPhone,
          deliveryAddress: orderDetails.deliveryAddress,
        },
        paymentMethod: orderDetails.paymentMethod,
        specialInstructions: orderDetails.specialInstructions,
      };

      // Create order via API
      const response = await foodService.createOrder(orderData);

      if (response.success) {
        const order = response.data;

        // Handle different payment methods
        if (orderDetails.paymentMethod === 'cash') {
          // For cash on delivery, order is complete
          clearCart();
          setOrderResult({
            success: true,
            order,
            message: 'Order placed successfully! Payment will be collected upon delivery.'
          });
          onOrderComplete(order);
        } else if (orderDetails.paymentMethod === 'card' && response.paymentResult?.redirectUrl) {
          // For card payments, redirect to payment gateway
          setOrderResult({
            success: true,
            order,
            redirectUrl: response.paymentResult.redirectUrl,
            message: 'Redirecting to payment gateway...'
          });
          // Redirect to payment gateway
          window.location.href = response.paymentResult.redirectUrl;
        } else if (orderDetails.paymentMethod === 'wallet') {
          // For wallet payments, order is complete
          clearCart();
          setOrderResult({
            success: true,
            order,
            message: 'Order placed successfully with wallet payment!'
          });
          onOrderComplete(order);
        }
      } else {
        throw new Error(response.message || 'Failed to create order');
      }

    } catch (error) {
      console.error('Error processing order:', error);
      setError(error.message || 'Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'cash', label: 'Cash on Delivery', icon: '💵' },
    { value: 'wallet', label: 'Digital Wallet', icon: '📱' }
  ];

  // Show error message
  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Order Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setError('')} variant="outline">
                Try Again
              </Button>
              <Button onClick={onClose}>
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication required message
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Authentication Required</h3>
                <p className="text-sm">Please log in to place your order.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={onClose}>
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show order result
  if (orderResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Order Placed Successfully!</h3>
                <p className="text-sm">{orderResult.message}</p>
                {orderResult.order && (
                  <p className="text-xs text-gray-600 mt-1">
                    Order ID: {orderResult.order._id}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={onClose}>
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Checkout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Summary</h3>

              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyMEMyNi4yMDkgMjAgMjguMjA5IDIxLjc5MSAyOCAyMkMyOCAyMi4yMDkgMjYuMjA5IDI0IDI0IDI0QzIxLjc5MSAyNCAyMCAyMi4yMDkgMjAgMjJDMjAgMjEuNzkxIDIxLjc5MSAyMCAyNCAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Order Type */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Order Type:</span>
                <Badge variant={isTakeaway ? "default" : "secondary"}>
                  {isTakeaway ? 'Takeaway' : 'Dine-in'}
                </Badge>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Details & Payment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Details</h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="customerName"
                      value={orderDetails.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={orderDetails.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="customerPhone"
                      value={orderDetails.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Show table/room field for dine-in, or delivery address for takeaway */}
                {!isTakeaway && (
                  <div>
                    <Label htmlFor="deliveryAddress">Table Number / Room</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="deliveryAddress"
                        value={orderDetails.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                        placeholder="Enter table number or room number"
                        className="pl-10"
                        required={!isTakeaway}
                      />
                    </div>
                  </div>
                )}

                {isTakeaway && (
                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="deliveryAddress"
                        value={orderDetails.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                        placeholder="Enter delivery address"
                        className="pl-10"
                        required={isTakeaway}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="specialInstructions"
                    value={orderDetails.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    placeholder="Any special requests or dietary requirements..."
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={orderDetails.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <span className="mr-2">{method.icon}</span>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Back to Cart
                </Button>
                <Button
                  onClick={handleSubmitOrder}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isProcessing || !user || !orderDetails.customerName || !orderDetails.customerEmail || !orderDetails.customerPhone || !orderDetails.deliveryAddress}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkout;