import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Clock } from 'lucide-react';
import FoodButton from './FoodButton';

/**
 * Offer Banner Component
 * Displays promotional offers with countdown and claim functionality
 */
const OfferBanner = ({ offer, onApply, isLoading = false }) => {
  if (!offer || !offer.title) return null;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Limited time';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg mb-6"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-full flex-shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl mb-1">{offer.title}</h3>
            <p className="opacity-90 mb-2">{offer.description}</p>
            <div className="flex items-center gap-4 text-sm">
              {offer.target?.minOrders && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>After {offer.target.minOrders} orders</span>
                </div>
              )}
              {offer.endDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Valid until {formatDate(offer.endDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-white text-orange-500 font-bold text-lg px-4 py-2 rounded-full mb-2">
            {offer.type === 'percentage' && `${offer.discountValue}% OFF`}
            {offer.type === 'fixed_amount' && `LKR ${offer.discountValue} OFF`}
            {offer.type === 'free_item' && 'FREE ITEM'}
            {!offer.type && offer.discountValue && `${offer.discountValue}% OFF`}
          </div>
          {onApply && (
            <FoodButton
              onClick={() => onApply(offer)}
              disabled={isLoading}
              className="bg-white text-orange-500 hover:bg-gray-100 font-semibold px-6 py-2 rounded-full disabled:opacity-50"
            >
              {isLoading ? 'Claiming...' : 'Claim Offer'}
            </FoodButton>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OfferBanner;

