import React from 'react';
import { motion } from 'framer-motion';
import { 
  Edit2, 
  Trash2, 
  Copy, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Gift,
  Clock,
  Target,
  Users
} from 'lucide-react';
import FoodButton from '../food/FoodButton';
import FoodBadge from '../food/FoodBadge';

const OfferCard = ({ offer, onEdit, onDelete, onDuplicate }) => {
  const getDiscountDisplay = () => {
    if (offer.type === 'percentage') return `${offer.discountValue}% OFF`;
    if (offer.type === 'fixed_amount') return `LKR ${offer.discountValue} OFF`;
    if (offer.type === 'free_item') return 'FREE ITEM';
    return offer.discountValue;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const end = new Date(offer.endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();
  const redemptionPercent = offer.maxRedemptions 
    ? (offer.redemptions / offer.maxRedemptions) * 100 
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Header with Discount Badge */}
      <div className={`p-6 ${
        offer.isActive 
          ? 'bg-gradient-to-r from-orange-500 to-red-500' 
          : 'bg-gradient-to-r from-gray-400 to-gray-500'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-white" />
              <h3 className="text-xl font-bold text-white">{offer.title}</h3>
            </div>
            <p className="text-white/90 text-sm line-clamp-2">{offer.description}</p>
          </div>
          <FoodBadge 
            variant={offer.isActive ? 'success' : 'default'}
            className="ml-2"
          >
            {offer.isActive ? 'Active' : 'Inactive'}
          </FoodBadge>
        </div>

        {/* Discount Value */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
          <p className="text-3xl font-bold text-white">{getDiscountDisplay()}</p>
          {offer.code && (
            <p className="text-white/80 text-sm mt-1">Code: {offer.code}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-gray-600 text-xs">Duration</p>
              <p className="font-semibold text-gray-900">
                {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
              </p>
            </div>
          </div>

          {/* Days Remaining */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-gray-600 text-xs">Time Left</p>
              <p className={`font-semibold ${
                daysRemaining < 7 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
              </p>
            </div>
          </div>

          {/* Redemptions */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-gray-600 text-xs">Redemptions</p>
              <p className="font-semibold text-gray-900">
                {offer.redemptions} {offer.maxRedemptions ? `/ ${offer.maxRedemptions}` : ''}
              </p>
            </div>
          </div>

          {/* Target */}
          {offer.target?.minOrders && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600 text-xs">Min Orders</p>
                <p className="font-semibold text-gray-900">{offer.target.minOrders}</p>
              </div>
            </div>
          )}
        </div>

        {/* Redemption Progress Bar */}
        {offer.maxRedemptions && (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Redemption Progress</span>
              <span>{Math.round(redemptionPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  redemptionPercent >= 100 
                    ? 'bg-red-500' 
                    : redemptionPercent >= 75 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(redemptionPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Jaffna Items */}
        {offer.jaffnaItems && offer.jaffnaItems.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Jaffna Specials:</p>
            <div className="flex flex-wrap gap-1">
              {offer.jaffnaItems.slice(0, 3).map((item, idx) => (
                <FoodBadge key={idx} variant="warning" className="text-xs">
                  {item}
                </FoodBadge>
              ))}
              {offer.jaffnaItems.length > 3 && (
                <FoodBadge variant="default" className="text-xs">
                  +{offer.jaffnaItems.length - 3} more
                </FoodBadge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t flex gap-2">
        <FoodButton
          onClick={() => onEdit(offer)}
          variant="outline"
          size="sm"
          className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </FoodButton>
        <FoodButton
          onClick={() => onDuplicate(offer)}
          variant="outline"
          size="sm"
          className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
        >
          <Copy className="w-4 h-4 mr-1" />
          Duplicate
        </FoodButton>
        <FoodButton
          onClick={() => onDelete(offer._id)}
          variant="outline"
          size="sm"
          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </FoodButton>
      </div>
    </motion.div>
  );
};

export default OfferCard;

