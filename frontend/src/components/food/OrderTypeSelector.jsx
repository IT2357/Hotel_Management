import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ShoppingBag, Clock, Users } from 'lucide-react';
import FoodButton from './FoodButton';

const OrderTypeSelector = ({ 
  selectedType, 
  onTypeChange, 
  className = '' 
}) => {
  const orderTypes = [
    {
      id: 'dine-in',
      label: 'Dine-in',
      description: 'Enjoy your meal at our restaurant',
      icon: ChefHat,
      features: ['Table service', 'Fresh preparation', 'Full experience'],
      estimatedTime: '15-25 min'
    },
    {
      id: 'takeaway',
      label: 'Takeaway',
      description: 'Pick up your order to go',
      icon: ShoppingBag,
      features: ['Quick pickup', 'Portable packaging', 'On-the-go'],
      estimatedTime: '10-20 min'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">Choose Order Type</h3>
        <p className="text-sm text-[#4A4A4A]/70">How would you like to receive your order?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orderTypes.map((type) => {
          const IconComponent = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-[#FF9933] bg-[#FF9933]/5 shadow-lg'
                  : 'border-gray-200 hover:border-[#FF9933]/50 hover:bg-gray-50'
              }`}
              onClick={() => onTypeChange(type.id)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#FF9933] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-[#FF9933]' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-6 h-6 ${
                    isSelected ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-lg font-semibold ${
                      isSelected ? 'text-[#4A4A4A]' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-[#4A4A4A]/70">
                      <Clock className="w-3 h-3" />
                      {type.estimatedTime}
                    </div>
                  </div>

                  <p className={`text-sm mb-3 ${
                    isSelected ? 'text-[#4A4A4A]/70' : 'text-gray-500'
                  }`}>
                    {type.description}
                  </p>

                  <div className="space-y-1">
                    {type.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-[#FF9933]' : 'bg-gray-400'
                        }`} />
                        <span className={isSelected ? 'text-[#4A4A4A]/80' : 'text-gray-500'}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular badge for dine-in */}
              {type.id === 'dine-in' && (
                <div className="absolute -top-2 -left-2">
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Popular
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Additional info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Need help choosing?
            </h4>
            <p className="text-xs text-blue-700">
              Dine-in offers the full restaurant experience with table service, 
              while takeaway is perfect for busy schedules or enjoying your meal elsewhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeSelector;
