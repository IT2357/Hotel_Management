// Placeholder for import React, { useState } from 'react';
import Card from '../ui/card';
import Button from '../ui/button';
import Input from '../ui/input';
import Select from '../ui/select';
import Badge from '../ui/badge';
import { CreditCard, Lock, Shield, Calendar, User, MapPin } from 'lucide-react';

export default function PaymentForm({ bookingData, onPaymentComplete, onCancel }) {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    paymentMethod: 'card'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'paypal', label: 'PayPal', icon: CreditCard },
    { value: 'bank', label: 'Bank Transfer', icon: CreditCard }
  ];

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!paymentData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    if (!paymentData.cardNumber.replace(/\s/g, '')) {
      newErrors.cardNumber = 'Card number is required';
    } else if (paymentData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!paymentData.expiryMonth) {
      newErrors.expiryMonth = 'Expiry month is required';
    }

    if (!paymentData.expiryYear) {
      newErrors.expiryYear = 'Expiry year is required';
    }

    if (!paymentData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (paymentData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful payment
      const paymentResult = {
        success: true,
        transactionId: 'TXN_' + Date.now(),
        amount: bookingData.totalPrice,
        currency: 'LKR',
        paymentMethod: paymentData.paymentMethod,
        processedAt: new Date().toISOString()
      };

      if (onPaymentComplete) {
        onPaymentComplete(paymentResult);
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month, label: month.toString().padStart(2, '0') };
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Payment Summary
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Room Booking</span>
            <span className="font-medium">
              LKR {bookingData.roomPrice?.toLocaleString()}
            </span>
          </div>

          {bookingData.foodPlan && bookingData.foodPlan !== 'None' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{bookingData.foodPlan}</span>
              <span className="font-medium">
                LKR {bookingData.foodTotal?.toLocaleString()}
              </span>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount</span>
              <span>{formatPrice(bookingData.totalPrice)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Payment Details
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentData.paymentMethod === method.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('paymentMethod', method.value)}
                >
                  <div className="flex items-center space-x-3">
                    <method.icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  value={paymentData.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  className="pl-10"
                  placeholder="Full name on card"
                  required
                />
              </div>
              {errors.cardholderName && (
                <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  value={paymentData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                  className="pl-10"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <Select
                  value={paymentData.expiryMonth}
                  onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                  required
                >
                  <option value="">MM</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </Select>
                {errors.expiryMonth && (
                  <p className="text-red-500 text-sm mt-1">{errors.expiryMonth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <Select
                  value={paymentData.expiryYear}
                  onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                  required
                >
                  <option value="">YYYY</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
                {errors.expiryYear && (
                  <p className="text-red-500 text-sm mt-1">{errors.expiryYear}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV *
                </label>
                <Input
                  type="text"
                  value={paymentData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength="4"
                  required
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Secure Payment
              </span>
            </div>
            <p className="text-sm text-green-700">
              Your payment information is encrypted and secure. We use industry-standard
              SSL encryption to protect your data.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay {formatPrice(bookingData.totalPrice)}
                </>
              )}
            </Button>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Payment Policies */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Payment & Cancellation Policy
        </h3>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
            <p>
              <strong>Free Cancellation:</strong> Cancel up to 24 hours before check-in
              for a full refund.
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
            <p>
              <strong>Payment:</strong> Full payment is required at the time of booking.
              Additional charges may apply for extra services.
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
            <p>
              <strong>Security:</strong> All transactions are processed securely through
              encrypted connections.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}