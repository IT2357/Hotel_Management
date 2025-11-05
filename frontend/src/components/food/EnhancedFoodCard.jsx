import React from 'react';
import { ShoppingCart, Star, Leaf, Flame, Clock, ChefHat } from 'lucide-react';
import FoodBadge from './FoodBadge';
import FoodButton from './FoodButton';

/**
 * Enhanced Food Card with Bilingual Support (Tamil/English)
 * Features: Jaffna discount, better badges, bilingual names
 */
const EnhancedFoodCard = ({ 
  item, 
  onAddToCart, 
  showDiscount = true,
  className = '' 
}) => {
  const originalPrice = parseFloat(item.price || 0);
  const discountedPrice = showDiscount ? (originalPrice * 0.95).toFixed(2) : originalPrice.toFixed(2);
  const hasDiscount = showDiscount && originalPrice > 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (item.isAvailable !== false) {
      onAddToCart?.(item);
    }
  };

  // Get bilingual names - support both naming conventions
  const englishName = item.name_english || item.nameEnglish || item.name || 'Unnamed Dish';
  const tamilName = item.name_tamil || item.nameTamil || item.name_ta;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#FF9933] ${className}`}>
      {/* Image */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
        {item.imageUrl || item.image ? (
          <img
            src={item.imageUrl || item.image}
            alt={englishName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 ${(item.imageUrl || item.image) ? 'hidden' : ''}`}>
          <ChefHat className="w-16 h-16 text-[#FF9933]" />
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {item.isVeg && (
            <FoodBadge variant="success" size="sm" className="flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              Veg
            </FoodBadge>
          )}
          {item.isSpicy && (
            <FoodBadge variant="spicy" size="sm" className="flex items-center gap-1 bg-red-500 text-white">
              <Flame className="w-3 h-3" />
              Spicy
            </FoodBadge>
          )}
          {item.isPopular && (
            <FoodBadge variant="popular" size="sm" className="flex items-center gap-1 bg-[#FF9933] text-white">
              <Star className="w-3 h-3 fill-white" />
              Popular
            </FoodBadge>
          )}
        </div>

        {/* Availability Badge */}
        {item.isAvailable === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
              Currently Unavailable
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3">
            <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              5% OFF
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Name - Bilingual */}
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
            {englishName}
          </h3>
          {tamilName && (
            <p className="text-sm sm:text-base text-gray-600 font-medium" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {tamilName}
            </p>
          )}
        </div>

        {/* Description */}
        {(item.description_english || item.descriptionEnglish || item.description) && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description_english || item.descriptionEnglish || item.description}
          </p>
        )}

        {/* Ingredients */}
        {item.ingredients && item.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.ingredients.slice(0, 3).map((ingredient, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {ingredient}
              </span>
            ))}
            {item.ingredients.length > 3 && (
              <span className="text-xs text-gray-500">+{item.ingredients.length - 3} more</span>
            )}
          </div>
        )}

        {/* Meal Time & Prep Time */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          {item.mealTime && item.mealTime.length > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Array.isArray(item.mealTime) ? item.mealTime.join(', ') : item.mealTime}
            </span>
          )}
          {(item.preparationTime || item.cookingTime) && (
            <span>{item.preparationTime || item.cookingTime} mins</span>
          )}
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#FF9933]">
                LKR {discountedPrice}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  LKR {originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-green-600 font-medium">5% Jaffna discount applied</p>
            )}
          </div>

          <FoodButton
            onClick={handleAddToCart}
            disabled={item.isAvailable === false}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              item.isAvailable !== false
                ? 'bg-[#FF9933] text-white hover:bg-[#FF7700] shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </FoodButton>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFoodCard;

