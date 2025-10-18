import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowLeft, 
  Download, 
  Share2,
  Star,
  ChefHat,
  Truck,
  Shield,
  Zap
} from 'lucide-react';
import FoodButton from '../components/food/FoodButton';
import SharedNavbar from '../components/shared/SharedNavbar';

const OrderConfirmationPage = ({ order, onBackToMenu, onContinueShopping }) => {
  const estimatedTime = order?.orderType === 'dine-in' ? '15-25 minutes' : '20-30 minutes';
  const orderNumber = order?._id?.substring(0, 8) || 'ORD-123456';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <SharedNavbar showBackButton={true} backPath="/" />
      
      <div className="max-w-4xl mx-auto pt-20 px-6 pb-12">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for choosing our authentic Jaffna cuisine. Your order has been successfully placed and we'll start preparing it right away.
          </p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
            <div className="flex gap-2">
              <FoodButton
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Receipt
              </FoodButton>
              <FoodButton
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </FoodButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Order Number</div>
                  <div className="text-2xl font-bold text-orange-500">#{orderNumber}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Estimated Time</div>
                  <div className="text-lg text-blue-600">{estimatedTime}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Order Type</div>
                  <div className="text-lg text-green-600 capitalize">{order?.orderType || 'Dine-in'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Payment</div>
                  <div className="text-lg text-purple-600 capitalize">{order?.paymentMethod || 'Cash'}</div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Customer Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {order?.guest?.firstName} {order?.guest?.lastName}
                    </div>
                    <div className="text-sm text-gray-600">Customer Name</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-semibold text-gray-800">{order?.guest?.email}</div>
                    <div className="text-sm text-gray-600">Email Address</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-semibold text-gray-800">{order?.guest?.phone}</div>
                    <div className="text-sm text-gray-600">Phone Number</div>
                  </div>
                </div>

                {order?.orderType === 'dine-in' && order?.tableNumber && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-semibold text-gray-800">Table {order.tableNumber}</div>
                      <div className="text-sm text-gray-600">Dine-in Location</div>
                    </div>
                  </div>
                )}

                {order?.orderType === 'takeaway' && order?.pickupTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-semibold text-gray-800">{order.pickupTime} minutes</div>
                      <div className="text-sm text-gray-600">Pickup Time</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Order Items</h3>
            <div className="space-y-4">
              {order?.items?.map((item, index) => (
                <div key={item._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={item.image || item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">LKR {(item.price * item.quantity).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">LKR {item.price.toFixed(2)} each</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-gray-800">Total Amount</div>
                <div className="text-3xl font-bold text-orange-500">LKR {order?.total?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">What's Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-orange-50 rounded-2xl">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Kitchen Preparation</h3>
              <p className="text-gray-600 text-sm">Our chefs are preparing your authentic Jaffna dishes with fresh ingredients</p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Status Updates</h3>
              <p className="text-gray-600 text-sm">We'll notify you via SMS when your order is ready for pickup/delivery</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-2xl">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Ready for You</h3>
              <p className="text-gray-600 text-sm">Your delicious Jaffna cuisine will be ready in {estimatedTime}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <FoodButton
            onClick={onBackToMenu}
            variant="outline"
            className="px-8 py-4 rounded-2xl font-semibold text-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Menu
          </FoodButton>
          <FoodButton
            onClick={onContinueShopping}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg"
          >
            Continue Shopping
          </FoodButton>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 p-6 bg-gray-50 rounded-2xl"
        >
          <h3 className="font-bold text-gray-800 mb-4">Need Help?</h3>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+94 77 123 4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>orders@jaffnarestaurant.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>123 Culinary Street, Jaffna</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
