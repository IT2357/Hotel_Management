import React, { useState } from 'react';
import { FoodButton } from '../ui/food/FoodButton';
import { FoodCard, FoodCardContent, FoodCardHeader, FoodCardTitle } from '../ui/food/FoodCard';
import { FoodInput } from '../ui/food/FoodInput';
import { FoodLabel } from '../ui/food/FoodLabel';
import { FoodTextarea } from '../ui/food/FoodTextarea';
import { FoodSelect } from '../ui/food/FoodSelect';
import { FoodBadge } from '../ui/food/FoodBadge';
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
      // Validate required fields
      if (!orderDetails.customerName || !orderDetails.customerPhone) {
        throw new Error('Please fill in all required fields');
      }

      if (isTakeaway && !orderDetails.deliveryAddress) {
        throw new Error('Please provide a delivery address for takeaway orders');
      }

      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total,
        isTakeaway,
        customerDetails: orderDetails,
        orderDate: new Date().toISOString(),
        status: 'pending'
      };

      // Submit order to backend
      const response = await foodService.createOrder(orderData);
      
      if (response.success) {
        const completedOrder = {
          orderId: response.data?.orderId || `ORDER-${Date.now()}`,
          total,
          items: orderData.items,
          isTakeaway,
          status: 'confirmed'
        };

        clearCart();
        setOrderResult(completedOrder);
        onOrderComplete?.(completedOrder);
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderResult) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h3>
        <p className="text-gray-400 mb-4">Your order ID is: {orderResult.orderId}</p>
        <FoodButton onClick={onClose}>Continue</FoodButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Order Summary */}
      <FoodCard variant="elevated">
        <FoodCardHeader>
          <FoodCardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Order Summary
          </FoodCardTitle>
        </FoodCardHeader>
        <FoodCardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || 'https://dummyimage.com/50x50/cccccc/000000&text=Dish'}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                {isTakeaway && <FoodBadge variant="primary">Takeaway</FoodBadge>}
              </div>
              <span className="text-2xl font-bold text-orange-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </FoodCardContent>
      </FoodCard>

      {/* Customer Details */}
      <FoodCard variant="elevated">
        <FoodCardHeader>
          <FoodCardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Details
          </FoodCardTitle>
        </FoodCardHeader>
        <FoodCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FoodLabel htmlFor="customerName" required>Full Name</FoodLabel>
              <FoodInput
                id="customerName"
                value={orderDetails.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <FoodLabel htmlFor="customerPhone" required>Phone Number</FoodLabel>
              <FoodInput
                id="customerPhone"
                value={orderDetails.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div className="md:col-span-2">
              <FoodLabel htmlFor="customerEmail">Email Address</FoodLabel>
              <FoodInput
                id="customerEmail"
                type="email"
                value={orderDetails.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            {isTakeaway && (
              <div className="md:col-span-2">
                <FoodLabel htmlFor="deliveryAddress" required>Delivery Address</FoodLabel>
                <FoodTextarea
                  id="deliveryAddress"
                  value={orderDetails.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  placeholder="Enter your full delivery address"
                  rows={3}
                  required
                />
              </div>
            )}
            <div className="md:col-span-2">
              <FoodLabel htmlFor="specialInstructions">Special Instructions</FoodLabel>
              <FoodTextarea
                id="specialInstructions"
                value={orderDetails.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Any special requests or dietary requirements..."
                rows={3}
              />
            </div>
          </div>
        </FoodCardContent>
      </FoodCard>

      {/* Payment Method */}
      <FoodCard variant="elevated">
        <FoodCardHeader>
          <FoodCardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </FoodCardTitle>
        </FoodCardHeader>
        <FoodCardContent>
          <div className="space-y-4">
            <FoodLabel htmlFor="paymentMethod">Select Payment Method</FoodLabel>
            <FoodSelect
              id="paymentMethod"
              value={orderDetails.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            >
              <option value="card">Credit/Debit Card</option>
              <option value="cash">Cash on Delivery</option>
              <option value="room">Charge to Room</option>
            </FoodSelect>
            
            {orderDetails.paymentMethod === 'card' && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Credit card payment will be processed securely. You will be redirected to the payment gateway after placing your order.
                </p>
              </div>
            )}
          </div>
        </FoodCardContent>
      </FoodCard>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6">
        <FoodButton
          onClick={onClose}
          variant="outline"
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </FoodButton>
        <FoodButton
          onClick={handleSubmitOrder}
          className="flex-1"
          disabled={isProcessing}
          loading={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
        </FoodButton>
      </div>
    </div>
  );
};

export default Checkout;