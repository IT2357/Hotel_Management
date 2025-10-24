import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Grid3x3, Flame, Coffee, Cake, Fish, Leaf } from 'lucide-react';

const iconMap = {
  'appetizer': Flame,
  'main': ChefHat,
  'dessert': Cake,
  'beverage': Coffee,
  'seafood': Fish,
  'vegetarian': Leaf,
  'default': Grid3x3
};

const CategorySidebar = ({ categories, selectedCategory, onSelectCategory, className = '' }) => {
  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('appetizer') || name.includes('starter')) return iconMap.appetizer;
    if (name.includes('main') || name.includes('entree')) return iconMap.main;
    if (name.includes('dessert') || name.includes('sweet')) return iconMap.dessert;
    if (name.includes('beverage') || name.includes('drink')) return iconMap.beverage;
    if (name.includes('seafood') || name.includes('fish')) return iconMap.seafood;
    if (name.includes('veg')) return iconMap.vegetarian;
    return iconMap.default;
  };

  return (
    <div className={`hidden lg:block w-80 flex-shrink-0 ${className}`}>
      <div className="sticky top-24 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Categories</h2>
              <p className="text-white/80 text-sm">Browse by type</p>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* All Items */}
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCategory('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
            <span className="flex-1 text-left">All Items</span>
            {selectedCategory === 'all' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-white rounded-full"
              />
            )}
          </motion.button>

          {/* Category Items */}
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            const isSelected = selectedCategory === category._id;

            return (
              <motion.button
                key={category._id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(category._id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{category.name}</span>
                {category.icon && !isSelected && (
                  <span className="text-xl">{category.icon}</span>
                )}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-t">
          <p className="text-xs text-gray-600 text-center">
            💡 Tip: Click on a category to filter items
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;

