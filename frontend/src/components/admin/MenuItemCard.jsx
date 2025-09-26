import React, { memo } from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Clock, DollarSign } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '../ui/Card';

// Get API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : (window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin);

const MenuItemCard = memo(({
  item,
  onEdit,
  onDelete,
  onToggleAvailability
}) => {
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle different image formats: base64, URL, or relative path
  const getImageSrc = (item) => {
    if (item.imageUrl && item.imageUrl.startsWith('data:')) {
      return item.imageUrl; // Base64 image
    } else if (item.imageUrl && item.imageUrl.startsWith('http')) {
      return item.imageUrl; // Full URL
    } else if (item.image && item.image.startsWith('http')) {
      return item.image; // Full URL in image field
    } else if (item.image && item.image.startsWith('/api/menu/image/')) {
      // Backend image URL - construct full URL
      return `${API_BASE_URL}${item.image}`;
    } else if (item.image && !item.image.startsWith('http') && !item.image.startsWith('data:')) {
      // Fallback for other paths
      return `${API_BASE_URL}/api${item.image}`;
    }
    return null;
  };

  const imageSrc = getImageSrc(item);

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isFeatured && (
            <Badge className="bg-purple-600 text-white text-xs">
              Featured
            </Badge>
          )}
          {item.isPopular && (
            <Badge className="bg-yellow-500 text-black text-xs">
              Popular
            </Badge>
          )}
          {!item.isAvailable && (
            <Badge className="bg-red-600 text-white text-xs">
              Unavailable
            </Badge>
          )}
        </div>

        {/* Availability Toggle */}
        <div className="absolute top-2 right-2">
          <Button
            size="sm"
            variant={item.isAvailable ? "default" : "secondary"}
            onClick={() => onToggleAvailability(item._id, item.isAvailable)}
            className={`p-2 rounded-full transition-colors ${
              item.isAvailable
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={item.isAvailable ? 'Click to disable' : 'Click to enable'}
            aria-label={item.isAvailable ? 'Disable menu item' : 'Enable menu item'}
          >
            {item.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-14 right-2 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(item)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            aria-label="Edit menu item"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDelete(item._id)}
            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            aria-label="Delete menu item"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Price */}
        <div className="absolute bottom-2 left-2">
          <span className="text-2xl font-bold text-white bg-black/50 px-2 py-1 rounded">
            LKR {item.price || '0.00'}
          </span>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {item.name || 'Unnamed Item'}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="capitalize">
            {typeof item.category === 'object' ? item.category?.name : item.category || 'Uncategorized'}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.cookingTime || 15}min
          </div>
        </div>

        {/* Dietary Tags and Properties */}
        <div className="flex flex-wrap gap-1">
          {item.isVeg && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">🌱 Veg</Badge>}
          {item.isSpicy && <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">🌶️ Spicy</Badge>}
          {item.isPopular && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">⭐ Popular</Badge>}
          {item.dietaryTags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {item.nutritionalInfo?.calories && (
          <div className="text-xs text-gray-500 mt-2">
            🔥 {item.nutritionalInfo.calories} calories
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MenuItemCard.displayName = 'MenuItemCard';

export { MenuItemCard };