// 📁 frontend/src/pages/admin/FoodMenuManagement.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Upload,
  Save,
  X,
  Eye,
  EyeOff,
  Star,
  Award,
  Clock,
  DollarSign,
  Image as ImageIcon,
  ChefHat
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const FoodMenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    ingredients: [],
    allergens: [],
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    dietaryTags: [],
    spiceLevel: 'mild',
    cookingTime: '',
    portions: [{ name: 'Regular', price: '' }],
    isAvailable: true,
    isPopular: false,
    isFeatured: false
  });

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSelectedImageFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedImageFile(file);
  };

  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG: Fetching menu data...');
      console.log('🔍 DEBUG: API endpoints being called:');
      console.log('🔍 DEBUG: - GET /food/menu/items');
      console.log('🔍 DEBUG: - GET /food/menu/categories');

      const [itemsRes, categoriesRes] = await Promise.all([
        api.get('/food/menu/items'),
        api.get('/food/menu/categories')
      ]);

      console.log('✅ DEBUG: Menu data fetched successfully');
      console.log('✅ DEBUG: Items response:', {
        status: itemsRes.status,
        hasData: !!itemsRes.data,
        dataKeys: itemsRes.data ? Object.keys(itemsRes.data) : [],
        itemsCount: itemsRes.data?.data?.items?.length || 0,
        itemsData: itemsRes.data?.data?.items
      });
      console.log('✅ DEBUG: Categories response:', {
        status: categoriesRes.status,
        hasData: !!categoriesRes.data,
        dataKeys: categoriesRes.data ? Object.keys(categoriesRes.data) : [],
        categoriesCount: categoriesRes.data?.data?.length || 0,
        categoriesData: categoriesRes.data?.data
      });

      if (itemsRes.data?.data?.items) {
        setMenuItems(itemsRes.data.data.items);
      } else {
        setMenuItems([]);
      }

      if (categoriesRes.data?.data) {
        setCategories(categoriesRes.data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ DEBUG: Error fetching menu data:', error);
      console.error('❌ DEBUG: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });

      // Check if it's a 404 - endpoint doesn't exist
      if (error.response?.status === 404) {
        console.error('❌ DEBUG: API endpoint not found! This suggests the backend routes are not properly configured.');
        console.error('❌ DEBUG: Expected routes: /food/menu/items, /food/menu/categories');
        console.error('❌ DEBUG: Check backend/routes/ directory for proper route definitions.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Scroll to top of scrollable container on submit
    const scrollableContainer = e.target.closest('.overflow-y-auto');
    if (scrollableContainer) {
      scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();

      // Add all form fields
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cookingTime: parseInt(formData.cookingTime) || 15,
        nutritionalInfo: {
          calories: formData.nutritionalInfo.calories ? parseInt(formData.nutritionalInfo.calories) : 0,
          protein: formData.nutritionalInfo.protein ? parseInt(formData.nutritionalInfo.protein) : 0,
          carbs: formData.nutritionalInfo.carbs ? parseInt(formData.nutritionalInfo.carbs) : 0,
          fat: formData.nutritionalInfo.fat ? parseInt(formData.nutritionalInfo.fat) : 0
        },
        portions: formData.portions.map(p => ({
          ...p,
          name: p.name || 'Regular',
          price: parseFloat(p.price) || 0
        }))
      };

      // Append all fields to FormData
      Object.keys(payload).forEach(key => {
        if (key === 'nutritionalInfo' || key === 'portions') {
          formDataToSend.append(key, JSON.stringify(payload[key]));
        } else if (Array.isArray(payload[key])) {
          formDataToSend.append(key, JSON.stringify(payload[key]));
        } else {
          formDataToSend.append(key, payload[key]);
        }
      });

      // Add image file if selected
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingItem) {
        await api.put(`/food/menu/items/${editingItem._id}`, formDataToSend, config);
        toast.success('Menu item updated successfully!');
      } else {
        await api.post('/food/menu/items', formDataToSend, config);
        toast.success('Menu item created successfully!');
      }

      await fetchMenuData();
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item: ' + (error.response?.data?.message || error.message));
    }
  }, [formData, editingItem, fetchMenuData, selectedImageFile]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/food/menu/items/${id}`);
        await fetchMenuData();
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  }, [fetchMenuData]);

  const startEdit = useCallback((item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price ? item.price.toString() : '',
      category: item.category?._id || item.category || '',
      image: item.image || '',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      nutritionalInfo: item.nutritionalInfo && typeof item.nutritionalInfo === 'object' ? {
        calories: item.nutritionalInfo.calories ? item.nutritionalInfo.calories.toString() : '',
        protein: item.nutritionalInfo.protein ? item.nutritionalInfo.protein.toString() : '',
        carbs: item.nutritionalInfo.carbs ? item.nutritionalInfo.carbs.toString() : '',
        fat: item.nutritionalInfo.fat ? item.nutritionalInfo.fat.toString() : ''
      } : {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
      spiceLevel: item.spiceLevel || 'mild',
      cookingTime: item.cookingTime ? item.cookingTime.toString() : '',
      portions: Array.isArray(item.portions) && item.portions.length > 0 
        ? item.portions.map(p => ({
            name: p.name || 'Regular',
            price: p.price ? p.price.toString() : ''
          }))
        : [{ name: 'Regular', price: item.price ? item.price.toString() : '' }],
      isAvailable: item.isAvailable !== false,
      isPopular: item.isPopular || false,
      isFeatured: item.isFeatured || false
    });
    setShowAddModal(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      ingredients: [],
      allergens: [],
      nutritionalInfo: {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      dietaryTags: [],
      spiceLevel: 'mild',
      cookingTime: '',
      portions: [{ name: 'Regular', price: '' }],
      isAvailable: true,
      isPopular: false,
      isFeatured: false
    });
    setSelectedImageFile(null);
    setEditingItem(null);
    setShowAddModal(false);
  }, []);

// Memoized Menu Item Card Component for better performance
const MenuItemCard = memo(({ item, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all"
    >
      {/* Image */}
      <div className="relative h-48">
        <img
          src={item.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item"}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {item.isFeatured && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
              Featured
            </span>
          )}
          {item.isPopular && (
            <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">
              Popular
            </span>
          )}
          {!item.isAvailable && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
              Unavailable
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <div className="absolute bottom-3 left-3">
          <span className="text-2xl font-bold text-white">
            LKR {item.price}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          {item.name}
        </h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{item.category?.name}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.cookingTime || 15}min
          </div>
        </div>
      </div>
    </motion.div>
  );
});

MenuItemCard.displayName = 'MenuItemCard';

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' ||
        (item.category && item.category._id === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const addPortion = () => {
    setFormData(prev => ({
      ...prev,
      portions: [...prev.portions, { name: '', price: '' }]
    }));
  };

  const removePortion = (index) => {
    setFormData(prev => ({
      ...prev,
      portions: prev.portions.filter((_, i) => i !== index)
    }));
  };

  const updatePortion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      portions: prev.portions.map((portion, i) =>
        i === index ? { ...portion, [field]: value || '' } : portion
      )
    }));
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      await api.post('/food/menu/categories', categoryData);
      await fetchMenuData(); // Refresh categories
      setShowCategoryModal(false);
      toast.success('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Food Menu Management
              </h1>
              <p className="text-gray-400">
                Manage your restaurant's menu items and categories
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Menu Item
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-purple-500/20"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Menu Items Grid */}
        <LazyMotion features={domAnimation}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredItems.map((item, index) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onEdit={startEdit}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        </LazyMotion>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
                  <h2 className="text-2xl font-bold text-white">
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <form onSubmit={handleSubmit} className="space-y-8" id="menu-form">
                  {/* Basic Information Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <ChefHat className="w-6 h-6 text-purple-400" />
                      </div>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Chicken Biryani"
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Category *
                        </label>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Price (LKR) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Cooking Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.cookingTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, cookingTime: e.target.value }))}
                          placeholder="15"
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-white font-medium mb-2">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the dish, its flavors, and special characteristics..."
                        className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      />
                    </div>
                  </motion.div>

                  {/* Ingredients & Details Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Star className="w-6 h-6 text-yellow-400" />
                      </div>
                      Ingredients & Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Ingredients (comma-separated)
                        </label>
                        <textarea
                          rows={4}
                          value={formData.ingredients.join(', ')}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            ingredients: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                          }))}
                          placeholder="e.g., Chicken, Rice, Spices, Onions, Tomatoes"
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Separate ingredients with commas</p>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Allergens (comma-separated)
                        </label>
                        <textarea
                          rows={4}
                          value={formData.allergens.join(', ')}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            allergens: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                          }))}
                          placeholder="e.g., Nuts, Dairy, Gluten"
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Separate allergens with commas</p>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Spice Level
                        </label>
                        <select
                          value={formData.spiceLevel}
                          onChange={(e) => setFormData(prev => ({ ...prev, spiceLevel: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        >
                          <option value="mild">🌶️ Mild</option>
                          <option value="medium">🌶️🌶️ Medium</option>
                          <option value="hot">🌶️🌶️🌶️ Hot</option>
                          <option value="very-hot">🌶️🌶️🌶️🌶️ Very Hot</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Dietary Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={formData.dietaryTags.join(', ')}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            dietaryTags: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                          }))}
                          placeholder="e.g., Vegetarian, Gluten-Free, Halal"
                          className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Nutritional Information Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Award className="w-6 h-6 text-green-400" />
                      </div>
                      Nutritional Information (per serving)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-white font-medium mb-2 text-sm">
                          Calories
                        </label>
                        <input
                          type="number"
                          value={formData.nutritionalInfo.calories}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            nutritionalInfo: { ...prev.nutritionalInfo, calories: e.target.value }
                          }))}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2 text-sm">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.nutritionalInfo.protein}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            nutritionalInfo: { ...prev.nutritionalInfo, protein: e.target.value }
                          }))}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2 text-sm">
                          Carbs (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.nutritionalInfo.carbs}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            nutritionalInfo: { ...prev.nutritionalInfo, carbs: e.target.value }
                          }))}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2 text-sm">
                          Fat (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.nutritionalInfo.fat}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            nutritionalInfo: { ...prev.nutritionalInfo, fat: e.target.value }
                          }))}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Media & Status Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-blue-400" />
                      </div>
                      Media & Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Image Upload
                        </label>
                        <div className="space-y-3">
                          <div className="flex gap-2 items-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                              id="image-upload"
                            />
                            <label
                              htmlFor="image-upload"
                              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                            >
                              <Upload className="w-4 h-4" />
                              Choose Image
                            </label>
                            {(selectedImageFile || formData.image) && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : formData.image}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-600"
                                />
                                <span className="text-gray-400 text-sm">
                                  {selectedImageFile ? selectedImageFile.name : 'Current image'}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">Max file size: 5MB. Supported formats: JPEG, PNG, WebP</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-white font-medium mb-3">
                          Status Options
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isAvailable}
                              onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                              className="rounded border-gray-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Available for Order</span>
                          </label>
                          <label className="flex items-center gap-3 text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isPopular}
                              onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                              className="rounded border-gray-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Mark as Popular</span>
                          </label>
                          <label className="flex items-center gap-3 text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isFeatured}
                              onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                              className="rounded border-gray-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Mark as Featured</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  </form>
                </div>

                {/* Footer - Fixed */}
                <div className="flex justify-end gap-4 p-6 border-t border-gray-700 bg-slate-800/95 backdrop-blur-sm flex-shrink-0">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-medium shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Creation Modal */}
        <AnimatePresence>
          {showCategoryModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-2xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Add New Category
                  </h2>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const categoryData = {
                    name: form.categoryName.value,
                    description: form.categoryDescription.value
                  };
                  handleCreateCategory(categoryData);
                }} className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      name="categoryName"
                      required
                      placeholder="e.g., Main Course, Appetizers"
                      className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      name="categoryDescription"
                      rows={3}
                      placeholder="Brief description of this category"
                      className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      <Save className="w-5 h-5" />
                      Create Category
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FoodMenuManagement;
