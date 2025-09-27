// 📁 frontend/src/components/menu/MenuItemModal.jsx
import { useState } from 'react';
import { X, Plus, Minus, Clock, Flame, Leaf } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const MenuItemModal = ({ item, isOpen, onClose }) => {
  const [selectedPortion, setSelectedPortion] = useState(
    item.portions?.find(p => p.isDefault) || 
    item.portions?.[0] || 
    { name: 'Regular', price: item.basePrice || item.displayPrice }
  );
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const { addToCart } = useCart();

  if (!isOpen) return null;

  const getSpiceIcon = (level) => {
    const flames = { Mild: 1, Medium: 2, Hot: 3 };
    return Array(flames[level] || 1).fill(0).map((_, i) => (
      <Flame key={i} size={16} className="text-red-500" />
    ));
  };

  const handleAddToCart = () => {
    addToCart(item, selectedPortion, quantity, specialInstructions);
    onClose();
  };

  const formatPrice = (price) => {
    return `Rs. ${price?.toLocaleString() || 0}`;
  };

  const totalPrice = selectedPortion.price * quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{item.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Image */}
          {item.primaryImage?.url || item.images?.[0]?.url ? (
            <img
              src={item.primaryImage?.url || item.images[0].url}
              alt={item.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 mb-4">{item.description}</p>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                item.type === 'Veg' 
                  ? 'bg-green-100 text-green-800' 
                  : item.type === 'Seafood'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.type}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 mr-2">Spice:</span>
              <div className="flex items-center space-x-1">
                {getSpiceIcon(item.spiceLevel)}
                <span className="text-sm text-gray-600">{item.spiceLevel}</span>
              </div>
            </div>
            {item.preparationTime && (
              <div className="flex items-center">
                <Clock size={16} className="text-gray-500 mr-2" />
                <span className="text-gray-600">{item.preparationTime} mins</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Category:</span>
              <span className="ml-2 text-gray-600">{item.category?.name}</span>
            </div>
          </div>

          {/* Dietary Tags */}
          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <div className="mb-4">
              <span className="font-medium text-gray-700 block mb-2">Dietary Info:</span>
              <div className="flex flex-wrap gap-2">
                {item.dietaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="mb-4">
              <span className="font-medium text-gray-700 block mb-2">Ingredients:</span>
              <p className="text-sm text-gray-600">{item.ingredients.join(', ')}</p>
            </div>
          )}

          {/* Portion Selection */}
          {item.portions && item.portions.length > 0 && (
            <div className="mb-4">
              <span className="font-medium text-gray-700 block mb-2">Size:</span>
              <div className="grid grid-cols-2 gap-2">
                {item.portions.map((portion) => (
                  <button
                    key={portion._id}
                    onClick={() => setSelectedPortion(portion)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedPortion._id === portion._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{portion.name}</div>
                    <div className="text-blue-600 font-semibold">
                      {formatPrice(portion.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mb-4">
            <label className="font-medium text-gray-700 block mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Less spicy, no onions, extra sauce..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {specialInstructions.length}/500 characters
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:bg-gray-200 rounded-full"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-600">
                {formatPrice(totalPrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add to Cart - {formatPrice(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
