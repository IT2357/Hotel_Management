import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Star,
  ChefHat,
  Leaf,
  Flame,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Utensils,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Fish,
  Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import api from '@/services/api';
import { useCart } from '@/context/CartContext';

const RestaurantMenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [cartQuantities, setCartQuantities] = useState({});
  const { addToCart, getItemCount, updateQuantity } = useCart();

  // Enhanced categories for filtering (matching Valampuri structure)
  const categories = [
    { value: 'all', label: 'All Categories', icon: Utensils },
    { value: 'appetizers', label: 'Appetizers & Starters', icon: Leaf },
    { value: 'main-course', label: 'Main Course', icon: ChefHat },
    { value: 'rice-dishes', label: 'Rice & Biryani', icon: Star },
    { value: 'seafood', label: 'Seafood Specialties', icon: Fish },
    { value: 'desserts', label: 'Desserts & Sweets', icon: Heart },
    { value: 'beverages', label: 'Beverages', icon: Coffee },
    { value: 'specials', label: 'Chef\'s Specials', icon: Star },
    { value: 'vegetarian', label: 'Vegetarian', icon: Leaf },
    { value: 'spicy', label: 'Spicy Dishes', icon: Flame }
  ];

  // Fetch menu items when component mounts or filters change
  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory, searchQuery]);

  // Fetch menu items from API
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/food/menu/items?${params}`);
      setMenuItems(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status
  const toggleFavorite = (itemId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(itemId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  };

  // Handle quantity changes
  const handleQuantityChange = (itemId, change) => {
    setCartQuantities(prev => {
      const current = prev[itemId] || 0;
      const newQuantity = Math.max(0, current + change);
      return { ...prev, [itemId]: newQuantity };
    });
  };

  // Add item to cart with quantity
  const handleAddToCart = (item, quantity = 1) => {
    if (quantity <= 0) return;

    for (let i = 0; i < quantity; i++) {
      addToCart(item);
    }
    toast.success(`${item.name || 'Item'} (${quantity}x) added to cart!`);
  };

  // Filter items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' ||
      item.category?.toLowerCase() === selectedCategory ||
      (selectedCategory === 'vegetarian' && item.isVeg) ||
      (selectedCategory === 'spicy' && item.isSpicy);
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable !== false;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Hero Section with Restaurant Info */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <ChefHat className="h-16 w-16" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
              Hotel Grand Menu
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 text-center">
              Authentic cuisine crafted with passion and tradition
            </p>

            {/* Restaurant Info */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm opacity-80">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                123 Hotel Street, City, State 12345
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                +1 (555) 123-4567
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                info@grandhotel.com
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filter */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search delicious dishes..."
                className="pl-10 w-full bg-white/80 backdrop-blur-sm border-orange-200 focus:border-orange-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-[250px] bg-white/80 backdrop-blur-sm border-orange-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center">
                        <IconComponent className="h-4 w-4 mr-2" />
                        {category.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Cart Icon */}
            <div className="flex items-center">
              <Button
                variant="outline"
                className="relative bg-white/90 hover:bg-orange-50 border-orange-200 hover:border-orange-300 transition-all duration-200"
                onClick={() => window.location.href = '/cart'}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getItemCount() > 0 && (
                  <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white">
                    {getItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Menu Items */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        ) : Object.keys(groupedItems).length > 0 ? (
          <div className="space-y-16">
            {Object.entries(groupedItems).map(([category, items], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {category}
                  </span>
                  <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-orange-200 to-red-200 rounded"></div>
                  <Badge variant="outline" className="ml-4 text-orange-600 border-orange-200">
                    {items.length} items
                  </Badge>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  <AnimatePresence>
                    {items.map((item, itemIndex) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: itemIndex * 0.05 }}
                      >
                        <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                          <div className="relative h-56 bg-gradient-to-br from-orange-100 to-red-100">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name || 'Menu item'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="bg-orange-100 p-4 rounded-full">
                                  <ChefHat className="h-12 w-12 text-orange-400" />
                                </div>
                              </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                              {item.isVeg && (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs shadow-md">
                                  <Leaf className="h-3 w-3 mr-1" />
                                  Veg
                                </Badge>
                              )}
                              {item.isSpicy && (
                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs shadow-md">
                                  <Flame className="h-3 w-3 mr-1" />
                                  Spicy
                                </Badge>
                              )}
                              {item.isPopular && (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs shadow-md">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                              {item.isNew && (
                                <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs shadow-md">
                                  New
                                </Badge>
                              )}
                            </div>

                            {/* Favorite Button */}
                            <button
                              onClick={() => toggleFavorite(item._id)}
                              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 shadow-md hover:scale-110"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  favorites.has(item._id)
                                    ? 'text-red-500 fill-red-500'
                                    : 'text-gray-400'
                                }`}
                              />
                            </button>
                          </div>

                          <CardContent className="p-6">
                            <div className="mb-4">
                              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                                {item.name || 'Unnamed Item'}
                              </h3>
                              {item.description && (
                                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center text-xl font-bold text-orange-600">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {item.cookingTime || 15} min
                              </div>
                            </div>

                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Key Ingredients:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.ingredients.slice(0, 4).map((ingredient, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs border-orange-200 text-orange-700">
                                      {ingredient}
                                    </Badge>
                                  ))}
                                  {item.ingredients.length > 4 && (
                                    <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                                      +{item.ingredients.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.nutritionalInfo && (item.nutritionalInfo.calories || item.nutritionalInfo.protein) && (
                              <div className="text-xs text-gray-500 mb-4 p-2 bg-orange-50 rounded">
                                {item.nutritionalInfo.calories && `${item.nutritionalInfo.calories} cal`}
                                {item.nutritionalInfo.calories && item.nutritionalInfo.protein && ' • '}
                                {item.nutritionalInfo.protein && `${item.nutritionalInfo.protein}g protein`}
                                {item.nutritionalInfo.fat && ` • ${item.nutritionalInfo.fat}g fat`}
                              </div>
                            )}

                            {/* Quantity Selector & Add to Cart */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item._id, -1)}
                                  className="h-8 w-8 p-0 border-orange-200 hover:bg-orange-50"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-medium min-w-[20px] text-center">
                                  {cartQuantities[item._id] || 0}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item._id, 1)}
                                  className="h-8 w-8 p-0 border-orange-200 hover:bg-orange-50"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <Button
                                onClick={() => handleAddToCart(item, cartQuantities[item._id] || 1)}
                                disabled={(cartQuantities[item._id] || 0) === 0}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add {cartQuantities[item._id] > 1 ? `(${cartQuantities[item._id]})` : ''}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/50 p-8 rounded-2xl shadow-lg max-w-md mx-auto">
              <ChefHat className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No menu items found</h3>
              <p className="text-gray-500">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'The menu is currently being updated. Please check back later.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-300">
            © 2024 Hotel Grand. All rights reserved. | Authentic cuisine with modern presentation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenuPage;