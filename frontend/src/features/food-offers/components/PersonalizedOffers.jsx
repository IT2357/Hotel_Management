import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Gift, Star } from 'lucide-react';
import OfferBanner from './OfferBanner';
import offerService from '../services/offerService';
import FoodButton from '../../../components/food/FoodButton';

const PersonalizedOffers = ({ onApplyOffer }) => {
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['personalizedOffers'],
    queryFn: () => offerService.getPersonalizedOffers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // Don't show error to user, just silently fail
    return null;
  }

  if (!offers?.data || offers.data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold text-gray-800">Special Offers Just for You</h3>
      </div>
      
      <div className="space-y-4">
        {offers.data.map((offer) => (
          <OfferBanner
            key={offer._id}
            offer={offer}
            onApply={() => onApplyOffer(offer)}
          />
        ))}
      </div>
    </div>
  );
};

export default PersonalizedOffers;