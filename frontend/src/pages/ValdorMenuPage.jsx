// 📁 frontend/src/pages/ValampuriMenuPage.jsx
import React, { useState, useEffect } from 'react';
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
  MapPin,
  Phone,
  Mail,
  Coffee,
  Utensils
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

const ValampuriMenuPage = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [favorites, setFavorites] = useState(new Set());
  const [cartQuantities, setCartQuantities] = useState({});
  const { addToCart, getItemCount, updateQuantity } = useCart();

  // Enhanced categories for filtering
  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: Utensils },
    { value: 'Breakfast', label: 'Breakfast', icon: Coffee },
    { value: 'Lunch', label: 'Lunch', icon: ChefHat },
    { value: 'Dinner', label: 'Dinner', icon: Star },
    { value: 'Snacks', label: 'Snacks', icon: Leaf },
    { value: 'Beverage', label: 'Beverages', icon: Coffee },
    { value: 'Dessert', label: 'Desserts', icon: Heart }
  ];

  const dietaryOptions = [
    { value: 'all', label: 'All Dietary' },
    { value: 'Vegetarian', label: 'Vegetarian' },
    { value: 'Non-Vegetarian', label: 'Non-Vegetarian' },
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Spicy', label: 'Spicy' },
    { value: 'Gluten-Free', label: 'Gluten-Free' }
  ];

  // Fetch foods when component mounts or filters change
  useEffect(() => {
    fetchFoods();
  }, [selectedCategory, searchQuery, selectedDietary, priceRange]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch foods from Valampuri API
  const fetchFoods = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (selectedDietary !== 'all') params.append('dietary', selectedDietary);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      params.append('isAvailable', 'true');

      const response = await api.get(`/valampuri/foods?${params}`);
      setFoods(response.data.data?.foods || []);
    } catch (error) {
      console.error('Error fetching Valampuri foods:', error);
      toast.error('Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/valampuri/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = (foodId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(foodId)) {
        newFavorites.delete(foodId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(foodId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  };

  // Handle quantity changes
  const handleQuantityChange = (foodId, change) => {
    setCartQuantities(prev => {
      const current = prev[foodId] || 0;
      const newQuantity = Math.max(0, current + change);
      return { ...prev, [foodId]: newQuantity };
    });
  };

  // Add to cart
  const handleAddToCart = (food) => {
    const quantity = cartQuantities[food._id] || 1;
    
    const cartItem = {
      id: food._id,
      name: food.name,
      price: food.price,
      image: food.imageUrl,
      category: food.category,
      quantity: quantity,
      preparationTime: food.preparationTimeMinutes,
      dietaryTags: food.dietaryTags
    };

    addToCart(cartItem);
    toast.success(`Added ${quantity} ${food.name} to cart`);
    
    // Reset quantity
    setCartQuantities(prev => ({ ...prev, [food._id]: 0 }));
  };

  // Group foods by category
  const groupedFoods = foods.reduce((acc, food) => {
    const category = food.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(food);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-16"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold mb-4"
          >
            🍛 Valampuri Restaurant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl opacity-90 mb-8"
          >
            Authentic Sri Lankan Cuisine & Traditional Flavors
          </motion.p>
          
          {/* Restaurant Info */}
          <div className="flex flex-wrap justify-center gap-6 text-sm opacity-80">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Colombo, Sri Lanka
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              +94 11 234 5678
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              info@valampuri.lk
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search delicious food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/90 border-orange-200 focus:border-orange-400"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white/90 border-orange-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => {
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

            {/* Dietary Filter */}
            <Select value={selectedDietary} onValueChange={setSelectedDietary}>
              <SelectTrigger className="bg-white/90 border-orange-200">
                <SelectValue placeholder="Dietary" />
              </SelectTrigger>
              <SelectContent>
                {dietaryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cart Icon */}
            <div className="flex items-center">
              <Button
                variant="outline"
                className="relative bg-white/90 hover:bg-orange-50 border-orange-200 hover:border-orange-300 transition-all duration-200 w-full"
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
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="container mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        ) : Object.keys(groupedFoods).length > 0 ? (
          <div className="space-y-16">
            {Object.entries(groupedFoods).map(([category, items], categoryIndex) => (
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
                    {items.map((food, itemIndex) => (
                      <motion.div
                        key={food._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: itemIndex * 0.05 }}
                      >
                        <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                          <div className="relative h-56 bg-gradient-to-br from-orange-100 to-red-100">
                            {food.imageUrl ? (
                              <img
                                src={food.imageUrl}
                                alt={food.name || 'Food item'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
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
                              {food.dietaryTags?.includes('Vegetarian') && (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs shadow-md">
                                  <Leaf className="h-3 w-3 mr-1" />
                                  Veg
                                </Badge>
                              )}
                              {food.dietaryTags?.includes('Spicy') && (
                                <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs shadow-md">
                                  <Flame className="h-3 w-3 mr-1" />
                                  Spicy
                                </Badge>
                              )}
                              {food.seasonal && (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs shadow-md">
                                  <Star className="h-3 w-3 mr-1" />
                                  Seasonal
                                </Badge>
                              )}
                            </div>

                            {/* Favorite Button */}
                            <button
                              onClick={() => toggleFavorite(food._id)}
                              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-all duration-200 shadow-md"
                            >
                              <Heart
                                className={`h-4 w-4 transition-colors ${
                                  favorites.has(food._id)
                                    ? 'text-red-500 fill-current'
                                    : 'text-gray-400 hover:text-red-400'
                                }`}
                              />
                            </button>
                          </div>

                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                                {food.name}
                              </h3>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-orange-600">
                                  LKR {food.price}
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {food.description}
                            </p>

                            {/* Food Details */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {food.preparationTimeMinutes} min
                              </div>
                              <div className="flex items-center">
                                <ChefHat className="h-3 w-3 mr-1" />
                                {food.category}
                              </div>
                            </div>

                            {/* Ingredients */}
                            {food.ingredients && food.ingredients.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                                <div className="flex flex-wrap gap-1">
                                  {food.ingredients.slice(0, 3).map((ingredient, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {ingredient}
                                    </Badge>
                                  ))}
                                  {food.ingredients.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{food.ingredients.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Add to Cart */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuantityChange(food._id, -1)}
                                  disabled={!cartQuantities[food._id]}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {cartQuantities[food._id] || 1}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuantityChange(food._id, 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <Button
                                onClick={() => handleAddToCart(food)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
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
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ValampuriMenuPage;
