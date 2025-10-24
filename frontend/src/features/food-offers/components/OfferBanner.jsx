import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Clock } from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';

const OfferBanner = ({ offer, onApply, isLoading = false }) => {
  if (!offer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg mb-6"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl mb-1">{offer.title}</h3>
            <p className="opacity-90 mb-2">{offer.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>
                  {offer.target?.minOrders 
                    ? `After ${offer.target.minOrders} orders` 
                    : 'Special offer'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  Valid until {new Date(offer.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-white text-orange-500 font-bold text-lg px-4 py-2 rounded-full mb-2">
            {offer.type === 'percentage' && `${offer.discountValue}% OFF`}
            {offer.type === 'fixed_amount' && `LKR ${offer.discountValue} OFF`}
            {offer.type === 'free_item' && 'FREE ITEM'}
          </div>
          <FoodButton
            onClick={() => onApply(offer)}
            loading={isLoading}
            className="bg-white text-orange-500 hover:bg-gray-100 font-semibold px-6 py-2 rounded-full"
          >
            Claim Offer
          </FoodButton>
        </div>
      </div>
    </motion.div>
  );
};

export default OfferBanner;