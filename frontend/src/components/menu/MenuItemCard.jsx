// 📁 frontend/src/components/menu/MenuItemCard.jsx
import { useState } from 'react';
import { Plus, Clock, Flame, Leaf } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import MenuItemModal from './MenuItemModal';

const MenuItemCard = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const { addToCart } = useCart();

  const getSpiceIcon = (level) => {
    const flames = { Mild: 1, Medium: 2, Hot: 3 };
    return Array(flames[level] || 1).fill(0).map((_, i) => (
      <Flame key={i} size={12} className="text-red-500" />
    ));
  };

  const getDietaryIcon = (tag) => {
    switch (tag) {
      case 'Vegan':
        return <Leaf size={12} className="text-green-500" />;
      case 'Halal':
        return <span className="text-xs font-bold text-green-600">H</span>;
      default:
        return null;
    }
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    const defaultPortion = item.portions?.find(p => p.isDefault) || 
                          item.portions?.[0] || 
                          { name: 'Regular', price: item.basePrice || item.displayPrice };
    addToCart(item, defaultPortion, 1);
  };

  const formatPrice = (price) => {
    return `Rs. ${price?.toLocaleString() || 0}`;
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          {item.primaryImage?.url || item.images?.[0]?.url ? (
            <img
              src={item.primaryImage?.url || item.images[0].url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-sm">No image</span>
            </div>
          )}
          
          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.type === 'Veg' 
                ? 'bg-green-100 text-green-800' 
                : item.type === 'Seafood'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {item.type}
            </span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {item.name}
            </h3>
            <div className="text-right">
              {item.portions && item.portions.length > 0 ? (
                <div className="text-sm text-gray-600">
                  From {formatPrice(Math.min(...item.portions.map(p => p.price)))}
                </div>
              ) : (
                <div className="font-semibold text-blue-600">
                  {formatPrice(item.basePrice || item.displayPrice)}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>

          {/* Tags and Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Spice Level */}
              <div className="flex items-center space-x-1">
                {getSpiceIcon(item.spiceLevel)}
              </div>

              {/* Dietary Tags */}
              {item.dietaryTags?.map((tag) => (
                <div key={tag} className="flex items-center">
                  {getDietaryIcon(tag)}
                </div>
              ))}

              {/* Prep Time */}
              {item.preparationTime && (
                <div className="flex items-center text-gray-500 text-xs">
                  <Clock size={12} className="mr-1" />
                  {item.preparationTime}m
                </div>
              )}
            </div>

            {/* Category */}
            <span className="text-xs text-gray-500">
              {item.category?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <MenuItemModal
          item={item}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default MenuItemCard;
