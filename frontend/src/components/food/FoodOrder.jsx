import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Star, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Rating from '../ui/rating';
import FoodReview from './FoodReview';

const FoodOrder = ({ order, onReviewUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleReviewSubmitted = (review) => {
    setShowReviewForm(false);
    if (onReviewUpdate) {
      onReviewUpdate(order._id, review);
    }
  };

  const canReview = order.status === 'Delivered' && !order.review;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Order Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                Order #{order._id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="font-semibold text-gray-800">
              ${order.totalPrice?.toFixed(2)}
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-1"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Order Details */}
      {showDetails && (
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Items */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Order Items</h4>
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-800">
                        {item.quantity}x
                      </span>
                      <span className="text-sm text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      ${item.price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Order Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-800">${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-800">${order.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charge:</span>
                  <span className="text-gray-800">${order.serviceCharge?.toFixed(2)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="text-gray-800">${order.deliveryFee?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-gray-800">${order.totalPrice?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          {order.customerDetails && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-800 mb-2">Delivery Details</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {order.customerDetails.name}</p>
                <p><strong>Phone:</strong> {order.customerDetails.phone}</p>
                {order.customerDetails.deliveryAddress && (
                  <p><strong>Address:</strong> {order.customerDetails.deliveryAddress}</p>
                )}
                {order.customerDetails.specialInstructions && (
                  <p><strong>Instructions:</strong> {order.customerDetails.specialInstructions}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Section */}
      <div className="p-4">
        {order.review ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">Your Review</h4>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Rating value={order.review.rating} readonly size="sm" />
              <span className="text-sm text-gray-600">
                {new Date(order.review.submittedAt).toLocaleDateString()}
              </span>
            </div>
            {order.review.comment && (
              <p className="text-gray-700 text-sm bg-white p-3 rounded border">
                {order.review.comment}
              </p>
            )}
          </div>
        ) : canReview ? (
          <div className="text-center">
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Star className="w-4 h-4" />
                Rate Your Order
              </button>
            ) : (
              <div className="mt-4">
                <FoodReview
                  orderId={order._id}
                  order={order}
                  onReviewSubmitted={handleReviewSubmitted}
                  onClose={() => setShowReviewForm(false)}
                />
              </div>
            )}
          </div>
        ) : order.status !== 'Delivered' ? (
          <div className="text-center text-gray-500 text-sm">
            <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-50" />
            Reviews available after delivery
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FoodOrder;