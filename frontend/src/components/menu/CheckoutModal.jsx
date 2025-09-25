// 📁 frontend/src/components/menu/CheckoutModal.jsx
import { useState } from 'react';
import { X, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { menuService } from '../../services/menuService';

const CheckoutModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Order Type, 2: Customer Info, 3: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const {
    cart,
    cartSubtotal,
    tax,
    serviceCharge,
    cartTotal,
    setOrderType,
    setTableNumber,
    setCustomerInfo,
    clearCart
  } = useCart();

  const [formData, setFormData] = useState({
    orderType: cart.orderType || 'Dine-in',
    tableNumber: cart.tableNumber || '',
    customerInfo: {
      name: cart.customerInfo?.name || '',
      phone: cart.customerInfo?.phone || '',
      email: cart.customerInfo?.email || ''
    },
    paymentMethod: 'Card'
  });

  if (!isOpen) return null;

  const formatPrice = (price) => {
    return `Rs. ${price?.toLocaleString() || 0}`;
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate order type and table number
      if (formData.orderType === 'Dine-in' && !formData.tableNumber.trim()) {
        setError('Please enter your table number');
        return;
      }
      setOrderType(formData.orderType);
      setTableNumber(formData.tableNumber);
    } else if (step === 2) {
      // Validate customer info
      if (!formData.customerInfo.name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!formData.customerInfo.phone.trim()) {
        setError('Please enter your phone number');
        return;
      }
      setCustomerInfo(formData.customerInfo);
    }
    
    setError('');
    setStep(step + 1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      // Prepare order data
      const orderData = {
        orderType: formData.orderType,
        tableNumber: formData.tableNumber,
        customerInfo: formData.customerInfo,
        items: cart.items.map(item => ({
          menuItem: item.menuItem,
          name: item.name,
          quantity: item.quantity,
          portion: item.portion,
          specialInstructions: item.specialInstructions,
          itemTotal: item.portion.price * item.quantity
        })),
        subtotal: cartSubtotal,
        tax,
        serviceCharge,
        total: cartTotal,
        paymentMethod: formData.paymentMethod,
        estimatedPrepTime: 30 // Default prep time
      };

      // Create order (this would normally go through payment processing)
      const response = await menuService.createOrder(orderData);
      
      if (response.success) {
        setOrderNumber(response.data.orderNumber);
        setOrderPlaced(true);
        clearCart();
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderTypeStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Order Type</h3>
      
      <div className="space-y-3">
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="orderType"
            value="Dine-in"
            checked={formData.orderType === 'Dine-in'}
            onChange={(e) => handleInputChange('orderType', e.target.value)}
            className="mr-3"
          />
          <div>
            <div className="font-medium">Dine-in</div>
            <div className="text-sm text-gray-600">Enjoy your meal at the restaurant</div>
          </div>
        </label>
        
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="orderType"
            value="Takeaway"
            checked={formData.orderType === 'Takeaway'}
            onChange={(e) => handleInputChange('orderType', e.target.value)}
            className="mr-3"
          />
          <div>
            <div className="font-medium">Takeaway</div>
            <div className="text-sm text-gray-600">Pick up your order</div>
          </div>
        </label>
      </div>

      {formData.orderType === 'Dine-in' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Table Number *
          </label>
          <input
            type="text"
            placeholder="e.g., T-05"
            value={formData.tableNumber}
            onChange={(e) => handleInputChange('tableNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );

  const renderCustomerInfoStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name *
        </label>
        <input
          type="text"
          placeholder="Your full name"
          value={formData.customerInfo.name}
          onChange={(e) => handleInputChange('customerInfo.name', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          placeholder="+94 77 123 4567"
          value={formData.customerInfo.phone}
          onChange={(e) => handleInputChange('customerInfo.phone', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email (Optional)
        </label>
        <input
          type="email"
          placeholder="your.email@example.com"
          value={formData.customerInfo.email}
          onChange={(e) => handleInputChange('customerInfo.email', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
      
      <div className="space-y-3">
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="Card"
            checked={formData.paymentMethod === 'Card'}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="mr-3"
          />
          <CreditCard className="mr-3 text-gray-600" size={20} />
          <div>
            <div className="font-medium">Credit/Debit Card</div>
            <div className="text-sm text-gray-600">Visa, MasterCard accepted</div>
          </div>
        </label>
        
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="Mobile Wallet"
            checked={formData.paymentMethod === 'Mobile Wallet'}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="mr-3"
          />
          <Smartphone className="mr-3 text-gray-600" size={20} />
          <div>
            <div className="font-medium">Mobile Wallet</div>
            <div className="text-sm text-gray-600">FriMi, Genie, etc.</div>
          </div>
        </label>
        
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="Cash"
            checked={formData.paymentMethod === 'Cash'}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="mr-3"
          />
          <DollarSign className="mr-3 text-gray-600" size={20} />
          <div>
            <div className="font-medium">Cash</div>
            <div className="text-sm text-gray-600">Pay at the restaurant</div>
          </div>
        </label>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (12.5%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge (10%)</span>
            <span>{formatPrice(serviceCharge)}</span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-amber-600">{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrderSuccess = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Placed Successfully!</h3>
      <p className="text-gray-600 mb-4">Your order number is:</p>
      <div className="text-2xl font-bold text-amber-600 mb-4">{orderNumber}</div>
      <p className="text-sm text-gray-600 mb-6">
        Estimated preparation time: 25-30 minutes
        <br />
        You'll receive updates on your order status.
      </p>
      <button
        onClick={onClose}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Continue Browsing
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {orderPlaced ? 'Order Confirmed' : 'Checkout'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {orderPlaced ? renderOrderSuccess() : (
            <>
              {/* Progress Steps */}
              {!orderPlaced && (
                <div className="flex items-center mb-6">
                  {[1, 2, 3].map((stepNumber) => (
                    <div key={stepNumber} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNumber 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {stepNumber}
                      </div>
                      {stepNumber < 3 && (
                        <div className={`w-12 h-0.5 mx-2 ${
                          step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step === 1 && renderOrderTypeStep()}
              {step === 2 && renderCustomerInfoStep()}
              {step === 3 && renderPaymentStep()}
            </>
          )}
        </div>

        {/* Footer */}
        {!orderPlaced && (
          <div className="border-t border-gray-200 p-4 flex justify-between">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : `Place Order - ${formatPrice(cartTotal)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
