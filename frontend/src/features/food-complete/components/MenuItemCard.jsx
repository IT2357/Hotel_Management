import React from 'react';
import { ShoppingCart, Star, Leaf, Flame, Clock } from 'lucide-react';

const MenuItemCard = ({ item }) => {
  const originalPrice = item.price;
  const discountedPrice = (originalPrice * 0.95).toFixed(2); // 5% Jaffna discount

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', item);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#FF9933]">
      {/* Image */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name_english}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {item.isVeg && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
              <Leaf className="w-3 h-3" />
              Veg
            </span>
          )}
          {item.isSpicy && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
              <Flame className="w-3 h-3" />
              Spicy
            </span>
          )}
          {item.isPopular && (
            <span className="bg-[#FF9933] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
              <Star className="w-3 h-3 fill-white" />
              Popular
            </span>
          )}
        </div>

        {/* Availability Badge */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Name - Bilingual */}
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
            {item.name_english}
          </h3>
          {item.name_tamil && (
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              {item.name_tamil}
            </p>
          )}
        </div>

        {/* Description */}
        {item.description_english && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description_english}
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
              {item.mealTime.join(', ')}
            </span>
          )}
          {item.preparationTime && (
            <span>{item.preparationTime} mins</span>
          )}
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#FF9933]">
                LKR {discountedPrice}
              </span>
              <span className="text-sm text-gray-400 line-through">
                LKR {originalPrice}
              </span>
            </div>
            <p className="text-xs text-green-600 font-medium">5% discount applied</p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              item.isAvailable
                ? 'bg-[#FF9933] text-white hover:bg-[#FF7700] shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
