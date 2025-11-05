import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Gift, 
  Target,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';
import FoodCard, { FoodCardContent, FoodCardHeader, FoodCardTitle } from '../food/FoodCard';
import FoodBadge from '../food/FoodBadge';

const OfferAnalytics = ({ stats = {}, topOffers = [] }) => {
  const defaultStats = {
    totalOffers: 0,
    activeOffers: 0,
    totalRedemptions: 0,
    monthlyRedemptions: 0,
    revenueImpact: 0,
    ...stats
  };

  const analyticsCards = [
    {
      title: 'Total Offers',
      value: defaultStats.totalOffers,
      icon: Gift,
      color: 'from-orange-500 to-red-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Active Offers',
      value: defaultStats.activeOffers,
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Redemptions',
      value: defaultStats.totalRedemptions,
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'This Month',
      value: defaultStats.monthlyRedemptions,
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Revenue Impact',
      value: `LKR ${defaultStats.revenueImpact.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-amber-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FoodCard className={`${card.bgColor} border-0`}>
                <FoodCardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${card.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </FoodCardContent>
              </FoodCard>
            </motion.div>
          );
        })}
      </div>

      {/* Top Performing Offers */}
      {topOffers && topOffers.length > 0 && (
        <FoodCard>
          <FoodCardHeader>
            <FoodCardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Top Performing Offers
            </FoodCardTitle>
          </FoodCardHeader>
          <FoodCardContent>
            <div className="space-y-3">
              {topOffers.slice(0, 5).map((offer, index) => (
                <motion.div
                  key={offer._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-orange-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{offer.title}</p>
                      <p className="text-xs text-gray-500">
                        {offer.redemptions || 0} redemptions
                      </p>
                    </div>
                  </div>
                  <FoodBadge
                    variant={offer.isActive ? 'success' : 'default'}
                  >
                    {offer.type === 'percentage' ? `${offer.discountValue}% OFF` :
                     offer.type === 'fixed_amount' ? `LKR ${offer.discountValue}` :
                     'Free Item'}
                  </FoodBadge>
                </motion.div>
              ))}
            </div>
          </FoodCardContent>
        </FoodCard>
      )}

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FoodCard className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <FoodCardHeader>
            <FoodCardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Quick Insights
            </FoodCardTitle>
          </FoodCardHeader>
          <FoodCardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Average Redemption Rate</span>
                <span className="font-semibold text-orange-600">
                  {defaultStats.totalOffers > 0
                    ? Math.round((defaultStats.totalRedemptions / defaultStats.totalOffers) * 10) / 10
                    : 0
                  } per offer
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active vs Total</span>
                <span className="font-semibold text-orange-600">
                  {defaultStats.totalOffers > 0
                    ? Math.round((defaultStats.activeOffers / defaultStats.totalOffers) * 100)
                    : 0
                  }% active
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monthly Growth</span>
                <span className="font-semibold text-green-600">
                  +{defaultStats.monthlyRedemptions} redemptions
                </span>
              </div>
            </div>
          </FoodCardContent>
        </FoodCard>

        <FoodCard className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <FoodCardHeader>
            <FoodCardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Performance Summary
            </FoodCardTitle>
          </FoodCardHeader>
          <FoodCardContent>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Your offer campaigns have generated <span className="font-semibold text-blue-600">
                  {defaultStats.totalRedemptions} total redemptions
                </span>, with an estimated revenue impact of <span className="font-semibold text-green-600">
                  LKR {defaultStats.revenueImpact.toLocaleString()}
                </span>.
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {defaultStats.activeOffers > 0 ? (
                  <>You currently have <span className="font-semibold text-orange-600">
                    {defaultStats.activeOffers} active offer{defaultStats.activeOffers > 1 ? 's' : ''}
                  </span> running.</>
                ) : (
                  <span className="text-gray-500">No active offers at the moment.</span>
                )}
              </div>
            </div>
          </FoodCardContent>
        </FoodCard>
      </div>
    </div>
  );
};

export default OfferAnalytics;

