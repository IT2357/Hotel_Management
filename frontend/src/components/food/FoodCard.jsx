import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { Loader2, ShoppingCart, Star, Clock, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import foodService from '../../services/foodService';

// Main Card component
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// Card Header Component
export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

CardHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// Card Title Component
export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
};

CardTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// Card Description Component
export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`} {...props}>
      {children}
    </p>
  );
};

CardDescription.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// Card Content Component
export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

CardContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// Card Footer Component
export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

CardFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// Enhanced Food Item Card Component
export const FoodItemCard = ({ 
  item, 
  onAddToCart, 
  onOrder, 
  onViewDetails,
  showActions = true,
  className = ''
}) => {
  const { isInCart, getItemQuantity, items } = useCart();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(0);

  // Get item quantity from cart and update when cart changes
  useEffect(() => {
    setLocalQuantity(getItemQuantity(item._id));
  }, [item._id, getItemQuantity, items]);

  // Fetch detailed item info if needed
  const { data: detailedItem, isLoading: isItemLoading } = useQuery({
    queryKey: ['menuItem', item._id],
    queryFn: () => foodService.getMenuItem(item._id),
    enabled: !!item._id && onViewDetails, // Only fetch if onViewDetails is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use detailed item if available, otherwise use the provided item
  const currentItem = detailedItem?.data || item;

  // Handle add to cart with optimistic update
  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      // Add to cart context first
      onAddToCart?.(currentItem);
      
      // Update local quantity after adding to cart
      setLocalQuantity(getItemQuantity(item._id) + 1);
      
      // Show toast
      toast.success(`${currentItem.name} added to cart`);
    } catch (error) {
      // Rollback on error
      toast.error('Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle order item
  const handleOrder = async () => {
    try {
      // Fetch fresh item details before ordering
      const freshItem = await foodService.getMenuItem(item._id);
      onOrder?.(freshItem.data);
    } catch (error) {
      toast.error('Failed to load item details');
    }
  };

  // Handle view details
  const handleViewDetails = async () => {
    try {
      // Invalidate and refetch for fresh data
      await queryClient.invalidateQueries(['menuItem', item._id]);
      onViewDetails?.(item);
    } catch (error) {
      toast.error('Failed to load item details');
    }
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
      {/* Item Image */}
      <div className="relative h-40 overflow-hidden">
        {currentItem.imageUrl ? (
          <img 
            src={currentItem.imageUrl} 
            alt={currentItem.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAzM3M0LjE2NiA0LjE2NiA0LjE2NiAxMC44MzQgMCAxNS00LjE2NiAxMC44MzQtNC4xNjYgNC4xNjYtMTA4MzQgMC0xMC44MzQtNC4xNjYtMTAuODM0LTEwLjgzNC4wLTE1eiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
        
        {/* Availability badge */}
        {!currentItem.isAvailable && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unavailable
          </div>
        )}
        
        {/* Veg/Spicy badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {currentItem.isVeg && (
            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">Veg</span>
          )}
          {currentItem.isSpicy && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">Spicy</span>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Item name and price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
            {currentItem.name}
          </h3>
          <span className="font-bold text-lg text-green-600 dark:text-green-400">
            LKR {currentItem.price?.toFixed(2)}
          </span>
        </div>

        {/* Description */}
        {currentItem.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {currentItem.description}
          </p>
        )}

        {/* Rating and prep time */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="text-gray-600 dark:text-gray-300">
              {currentItem.rating?.toFixed(1) || 'N/A'}
            </span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            <span>{currentItem.prepTime || 'N/A'} min</span>
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2">
            <button
              onClick={handleViewDetails}
              className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isItemLoading}
            >
              {isItemLoading ? (
                <Loader2 className="w-4 h-4 mx-auto animate-spin" />
              ) : (
                'Details'
              )}
            </button>
            
            {onOrder && (
              <button
                onClick={handleOrder}
                className="flex-1 py-2 px-3 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                disabled={!currentItem.isAvailable || isAdding}
              >
                Order
              </button>
            )}
            
            {onAddToCart && (
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center py-2 px-3 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors relative"
                disabled={!currentItem.isAvailable || isAdding}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : localQuantity > 0 ? (
                  <>
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {localQuantity}
                    </span>
                    <ShoppingCart className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

FoodItemCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string,
    imageUrl: PropTypes.string,
    isAvailable: PropTypes.bool,
    isVeg: PropTypes.bool,
    isSpicy: PropTypes.bool,
    rating: PropTypes.number,
    prepTime: PropTypes.number,
  }).isRequired,
  onAddToCart: PropTypes.func,
  onOrder: PropTypes.func,
  onViewDetails: PropTypes.func,
  showActions: PropTypes.bool,
  className: PropTypes.string,
};

// Simple FoodCard (for backward compatibility)
const FoodCard = ({ title, children, className = '', ...props }) => {
  return (
    <Card className={className} {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
};

FoodCard.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string
};

// Export aliases for backwards compatibility
export const FoodCardContent = CardContent;
export const FoodCardHeader = CardHeader;
export const FoodCardTitle = CardTitle;
export const FoodCardDescription = CardDescription;
export const FoodCardFooter = CardFooter;

export default FoodCard;