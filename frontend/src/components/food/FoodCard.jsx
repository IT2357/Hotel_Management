import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Users, Star, Leaf, Flame } from 'lucide-react';

const FoodCard = ({
  item,
  onEdit,
  onDelete,
  onOrder,
  onAddToCart,
  showActions = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Default image placeholder
  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTI1QzE2NS42ODggMTI1IDE3OC41IDEzNy44MTIgMTc4LjUgMTUzLjVDMTc4LjUgMTY5LjE4OCAxNjUuNjg4IDE4MiAxNTAgMTgyQzEzNC4zMTIgMTgyIDEyMS41IDE2OS4xODggMTIxLjUgMTUzLjVDMTIxLjUgMTM3LjgxMiAxMzQuMzEyIDEyNSAxNTAgMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTUwIDc1QzE2NS42ODggNzUgMTc4LjUgODcuODEyNSAxNzguNSA5My41QzE3OC41IDk5LjE4NzUgMTY1LjY4OCAxMTIgMTUwIDExMkMxMzQuMzEyIDExMiAxMjEuNSA5OS4xODc1IDEyMS41IDkzLjVDMTIxLjUgODcuODEyNSAxMzQuMzEyIDc1IDE1MCA3NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getImageSrc = () => {
    if (imageError || !item.imageUrl) {
      return defaultImage;
    }
    return item.imageUrl;
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-gray-100">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          <img
            src={getImageSrc()}
            alt={item.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {item.isPopular && (
              <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            {item.isVeg && (
              <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                <Leaf className="w-3 h-3 mr-1" />
                Veg
              </Badge>
            )}
            {item.isSpicy && (
              <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                <Flame className="w-3 h-3 mr-1" />
                Spicy
              </Badge>
            )}
          </div>

          {/* Availability badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={item.isAvailable ? "default" : "secondary"}
              className={item.isAvailable ? "bg-green-500" : "bg-gray-500"}
            >
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
          <span className="font-bold text-lg text-primary ml-2">
            {formatPrice(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{item.cookingTime || 15} min</span>
          </div>
          <span className="capitalize">{item.category}</span>
        </div>

        {/* Ingredients */}
        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {item.ingredients.slice(0, 3).map((ingredient, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {ingredient}
                </Badge>
              ))}
              {item.ingredients.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.ingredients.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Nutritional info */}
        {item.nutritionalInfo && (
          <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
            {item.nutritionalInfo.calories && (
              <span>Calories: {item.nutritionalInfo.calories}</span>
            )}
            {item.nutritionalInfo.protein && (
              <span>Protein: {item.nutritionalInfo.protein}g</span>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          {onOrder && (
            <Button
              onClick={() => onOrder(item)}
              className="flex-1"
              disabled={!item.isAvailable}
            >
              Order Now
            </Button>
          )}
          {onAddToCart && (
            <Button
              onClick={() => onAddToCart(item)}
              variant="outline"
              className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
              disabled={!item.isAvailable}
            >
              🛒 Add to Cart
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={() => onEdit(item)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(item)}
              variant="destructive"
              size="sm"
            >
              Delete
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default FoodCard;