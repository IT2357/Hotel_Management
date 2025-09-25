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
  ChefHat,
  ToggleLeft,
  ToggleRight,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const FoodMenuManagement = () => {
  const { settings, updateSettings } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

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
    timeSlots: [],
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
    
      const [itemsRes, categoriesRes] = await Promise.all([
        api.get('/menu/items'),
        api.get('/menu/categories')
      ]);

      // Handle different response structures
      let items = [];
      if (itemsRes.data?.data?.items) {
        items = itemsRes.data.data.items;
      } else if (itemsRes.data?.data && Array.isArray(itemsRes.data.data)) {
        items = itemsRes.data.data;
      } else if (Array.isArray(itemsRes.data)) {
        items = itemsRes.data;
      }

      let cats = [];
      if (categoriesRes.data?.data && Array.isArray(categoriesRes.data.data)) {
        cats = categoriesRes.data.data;
      } else if (Array.isArray(categoriesRes.data)) {
        cats = categoriesRes.data;
      }

      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching menu data:', error);

      // Check if it's a 404 - endpoint doesn't exist
      if (error.response?.status === 404) {
        console.log('Menu API endpoint not found');
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
    
      // Validate time slots
      const validTimeSlots = formData.timeSlots.filter(slot => 
        slot.startTime && slot.endTime && slot.days.length > 0
      );

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
        })),
        timeSlots: validTimeSlots
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
        await api.put(`/menu/items/${editingItem._id}`, formDataToSend, config);
        toast.success('Menu item updated successfully!');
      } else {
        await api.post('/menu/items', formDataToSend, config);
        toast.success('Menu item created successfully!');
      }

      await fetchMenuData();
      resetForm();
      // Keep modal open for adding multiple items
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item: ' + (error.response?.data?.message || error.message));
    }
  }, [formData, editingItem, fetchMenuData, selectedImageFile]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/menu/items/${id}`);
        await fetchMenuData();
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  }, [fetchMenuData]);

  const handleToggleAvailability = useCallback(async (itemId, currentStatus) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('isAvailable', (!currentStatus).toString());
      
      await api.put(`/menu/items/${itemId}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchMenuData();
      toast.success(`Menu item ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update item availability');
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
      timeSlots: Array.isArray(item.timeSlots) ? item.timeSlots : [],
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
      timeSlots: [],
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
    // Don't close modal automatically - let user add multiple items
  }, []);

// Memoized Menu Item Card Component for better performance
const MenuItemCard = memo(({ item, onEdit, onDelete, onToggleAvailability }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-sm rounded-xl overflow-hidden border transition-all ${
        isDarkMode
          ? 'bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40'
          : 'bg-white/80 border-purple-500/30 hover:border-purple-500/50 shadow-lg'
      }`}
    >
      {/* Image */}
      <div className="relative h-48">
        <img
          src={imageError ? "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item" : (item.imageUrl || item.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item")}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={handleImageError}
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

        {/* Availability Toggle - Properly aligned within card */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={() => onToggleAvailability(item._id, item.isAvailable)}
            className={`p-2 rounded-full transition-colors ${
              item.isAvailable 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={item.isAvailable ? 'Click to disable' : 'Click to enable'}
          >
            {item.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-16 right-3 flex flex-col gap-2">
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
        <h3 className={`text-lg font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {item.name}
        </h3>
        <p className={`text-sm mb-3 line-clamp-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {item.description}
        </p>

        <div className={`flex items-center justify-between text-xs ${
          isDarkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          <span>{item.category?.name}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.cookingTime || 15}min
          </div>
        </div>
        
        {/* Time Slots Display */}
        {item.timeSlots && item.timeSlots.length > 0 && (
          <div className="mt-2">
            <div className={`text-xs font-medium mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Available Times:
            </div>
            <div className="flex flex-wrap gap-1">
              {item.timeSlots.map((slot, index) => (
                <span key={index} className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  {slot.startTime}-{slot.endTime}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

MenuItemCard.displayName = 'MenuItemCard';
  
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        item.category === selectedCategory;
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

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { startTime: '', endTime: '', days: [] }]
    }));
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const toggleTimeSlotDay = (slotIndex, day) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => {
        if (i === slotIndex) {
          const days = slot.days.includes(day)
            ? slot.days.filter(d => d !== day)
            : [...slot.days, day];
          return { ...slot, days };
        }
        return slot;
      })
    }));
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      await api.post('/menu/categories', categoryData);
      await fetchMenuData();
      setShowCategoryModal(false);
      toast.success('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-4xl font-bold bg-clip-text text-transparent ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600'
              }`}>
                Food Menu Management
              </h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Manage your restaurant's menu items and categories
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
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
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-sm rounded-xl p-6 mb-6 border transition-colors duration-300 ${
            isDarkMode
              ? 'bg-slate-800/50 border-purple-500/20'
              : 'bg-white/80 border-purple-500/30 shadow-lg'
          }`}
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-slate-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-slate-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
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
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </motion.div>
        </LazyMotion>

        {filteredItems.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <ChefHat className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>No menu items found</h3>
            <p className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Create your first menu item to get started</p>
          </motion.div>
        )}

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
                className={`rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden transition-colors duration-300 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-white'
                }`}
              >
                {/* Header - Fixed */}
                <div className={`flex items-center justify-between p-6 border-b flex-shrink-0 transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <h2 className={`text-2xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information Section */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Item Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="e.g., Chicken Biryani"
                          />
                        </div>

                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Price (LKR) *
                          </label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="250.00"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className={`block font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Category *
                        </label>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-slate-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-6">
                        <label className={`block font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Description *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-slate-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Describe your menu item..."
                        />
                      </div>

                      {/* Ingredients */}
                      <div className="mt-6">
                        <label className={`block font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Ingredients
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(formData.ingredients) ? formData.ingredients.join(', ') : ''}
                          onChange={(e) => {
                            const ingredientsArray = e.target.value
                              .split(',')
                              .map(item => item.trim())
                              .filter(item => item.length > 0);
                            setFormData(prev => ({ ...prev, ingredients: ingredientsArray }));
                          }}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-slate-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="tomato, onion, garlic, spices (separate with commas)"
                        />
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Separate ingredients with commas
                        </p>
                      </div>

                      {/* Allergens */}
                      <div className="mt-6">
                        <label className={`block font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Allergens
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(formData.allergens) ? formData.allergens.join(', ') : ''}
                          onChange={(e) => {
                            const allergensArray = e.target.value
                              .split(',')
                              .map(item => item.trim())
                              .filter(item => item.length > 0);
                            setFormData(prev => ({ ...prev, allergens: allergensArray }));
                          }}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-slate-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="nuts, dairy, gluten (separate with commas)"
                        />
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Separate allergens with commas
                        </p>
                      </div>

                      {/* Dietary Tags */}
                      <div className="mt-6">
                        <label className={`block font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Dietary Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal', 'spicy', 'mild'].map(tag => (
                            <label key={tag} className={`flex items-center gap-2 cursor-pointer ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              <input
                                type="checkbox"
                                checked={formData.dietaryTags.includes(tag)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      dietaryTags: [...prev.dietaryTags, tag]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      dietaryTags: prev.dietaryTags.filter(t => t !== tag)
                                    }));
                                  }
                                }}
                                className={`rounded focus:ring-purple-500 transition-colors ${
                                  isDarkMode
                                    ? 'border-gray-600 bg-slate-700 text-purple-600'
                                    : 'border-gray-300 bg-white text-purple-600'
                                }`}
                              />
                              <span className="text-sm capitalize">{tag}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Spice Level & Cooking Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Spice Level
                          </label>
                          <select
                            value={formData.spiceLevel}
                            onChange={(e) => setFormData(prev => ({ ...prev, spiceLevel: e.target.value }))}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="mild">Mild</option>
                            <option value="medium">Medium</option>
                            <option value="hot">Hot</option>
                            <option value="very-hot">Very Hot</option>
                          </select>
                        </div>

                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Cooking Time (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={formData.cookingTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, cookingTime: e.target.value }))}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="15"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nutritional Information */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Nutritional Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Calories
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.nutritionalInfo.calories}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              nutritionalInfo: { ...prev.nutritionalInfo, calories: e.target.value }
                            }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="250"
                          />
                        </div>
                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Protein (g)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.nutritionalInfo.protein}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              nutritionalInfo: { ...prev.nutritionalInfo, protein: e.target.value }
                            }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="15"
                          />
                        </div>
                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Carbs (g)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.nutritionalInfo.carbs}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              nutritionalInfo: { ...prev.nutritionalInfo, carbs: e.target.value }
                            }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className={`block font-medium mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Fat (g)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.nutritionalInfo.fat}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              nutritionalInfo: { ...prev.nutritionalInfo, fat: e.target.value }
                            }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Portions Management */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Portions & Pricing</h3>
                      {formData.portions.map((portion, index) => (
                        <div key={index} className="flex gap-4 mb-4 items-end">
                          <div className="flex-1">
                            <label className={`block font-medium mb-2 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              Portion Name
                            </label>
                            <input
                              type="text"
                              value={portion.name}
                              onChange={(e) => updatePortion(index, 'name', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                                isDarkMode
                                  ? 'bg-slate-700 border-gray-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              placeholder="Regular, Large, Family"
                            />
                          </div>
                          <div className="flex-1">
                            <label className={`block font-medium mb-2 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              Price (LKR)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={portion.price}
                              onChange={(e) => updatePortion(index, 'price', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                                isDarkMode
                                  ? 'bg-slate-700 border-gray-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              placeholder="250.00"
                            />
                          </div>
                          {formData.portions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePortion(index)}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addPortion}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Portion
                      </button>
                    </div>

                    {/* Time Slots Management */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Availability Time Slots</h3>
                      <p className={`text-sm mb-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Set specific times when this item is available (e.g., breakfast items only in morning)
                      </p>
                      
                      {formData.timeSlots.length === 0 ? (
                        <div className={`text-center py-4 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No time restrictions - Available all day</p>
                        </div>
                      ) : (
                        formData.timeSlots.map((slot, index) => (
                          <div key={index} className={`p-4 mb-4 border rounded-lg ${
                            isDarkMode ? 'border-gray-600 bg-slate-800/50' : 'border-gray-300 bg-white'
                          }`}>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className={`font-medium ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>Time Slot {index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeTimeSlot(index)}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className={`block font-medium mb-2 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                                    isDarkMode
                                      ? 'bg-slate-700 border-gray-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className={`block font-medium mb-2 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                                    isDarkMode
                                      ? 'bg-slate-700 border-gray-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                            </div>
                            
                            {/* Days Selection */}
                            <div>
                              <label className={`block font-medium mb-2 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                Available Days
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleTimeSlotDay(index, day)}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                      slot.days.includes(day)
                                        ? 'bg-purple-600 text-white'
                                        : isDarkMode
                                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {day.slice(0, 3)}
                                  </button>
                                ))}
                              </div>
                              {slot.days.length === 0 && (
                                <p className={`text-xs mt-1 ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                  Please select at least one day
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      
                      <button
                        type="button"
                        onClick={addTimeSlot}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        Add Time Slot
                      </button>
                    </div>

                    {/* Media & Status Section */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Media & Status</h3>

                      {/* Image Upload */}
                      <div className="mb-6">
                        <label className={`block font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Item Image
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                              isDarkMode
                                ? 'bg-slate-700 border-gray-600 text-white hover:bg-slate-600'
                                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <Upload className="w-5 h-5" />
                            Choose Image
                          </label>
                          {selectedImageFile && (
                            <span className={`text-sm ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>
                              {selectedImageFile.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Options */}
                      <div className="space-y-3">
                        <h4 className={`text-md font-medium mb-3 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Item Status</h4>
                        <label className={`flex items-center gap-3 cursor-pointer ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.isAvailable}
                            onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                            className={`rounded focus:ring-purple-500 transition-colors ${
                              isDarkMode
                                ? 'border-gray-600 bg-slate-700 text-purple-600'
                                : 'border-gray-300 bg-white text-purple-600'
                            }`}
                          />
                          <span className="text-sm">Available for Order</span>
                        </label>
                        <label className={`flex items-center gap-3 cursor-pointer ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.isPopular}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                            className={`rounded focus:ring-purple-500 transition-colors ${
                              isDarkMode
                                ? 'border-gray-600 bg-slate-700 text-purple-600'
                                : 'border-gray-300 bg-white text-purple-600'
                            }`}
                          />
                          <span className="text-sm">Mark as Popular</span>
                        </label>
                        <label className={`flex items-center gap-3 cursor-pointer ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                            className={`rounded focus:ring-purple-500 transition-colors ${
                              isDarkMode
                                ? 'border-gray-600 bg-slate-700 text-purple-600'
                                : 'border-gray-300 bg-white text-purple-600'
                            }`}
                          />
                          <span className="text-sm">Mark as Featured</span>
                        </label>
                      </div>
                    </div>

                    {/* Help Section */}
                    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <h4 className={`text-sm font-semibold mb-2 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-800'
                      }`}>💡 Tips for Better Menu Items</h4>
                      <ul className={`text-xs space-y-1 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      }`}>
                        <li>• Use clear, descriptive names that highlight key ingredients</li>
                        <li>• Keep descriptions concise but informative (50-100 words)</li>
                        <li>• High-quality images improve customer engagement</li>
                        <li>• Mark popular items to highlight them in the menu</li>
                        <li>• Featured items appear prominently on the main menu page</li>
                      </ul>
                    </div>
                  </form>
                </div>

                {/* Footer - Fixed */}
                <div className={`flex justify-end gap-4 p-6 border-t backdrop-blur-sm flex-shrink-0 transition-colors duration-300 ${
                  isDarkMode
                    ? 'border-gray-700 bg-slate-800/95'
                    : 'border-gray-200 bg-white/95'
                }`}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                      isDarkMode
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
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
                className={`rounded-2xl p-6 w-full max-w-md transition-colors duration-300 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Add New Category
                  </h2>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className={`p-2 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    }`}
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
                    <label className={`block font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      name="categoryName"
                      required
                      placeholder="e.g., Main Course, Appetizers"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-slate-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Description
                    </label>
                    <textarea
                      name="categoryDescription"
                      rows={3}
                      placeholder="Brief description of this category"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-slate-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div className={`flex justify-end gap-4 pt-4 border-t transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className={`px-6 py-3 rounded-lg transition-colors ${
                        isDarkMode
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
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
