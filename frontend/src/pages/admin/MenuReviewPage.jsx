import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Upload,
  Trash2,
  DollarSign,
  FileText,
  Tag,
  Clock,
  Loader2
} from 'lucide-react';
import api from '../../services/api';

const MenuReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuData, setMenuData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Load menu data
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        if (location.state?.menuData) {
          // Use data from navigation state
          setMenuData(location.state.menuData);
          setStats(location.state.stats);
        } else {
          // Fetch from API
          const response = await api.get(`/uploadMenu/${id}`);
          setMenuData(response.data.data);
          setStats({
            totalCategories: response.data.data.totalCategories,
            totalItems: response.data.data.totalItems,
            confidence: response.data.data.confidence,
            extractionMethod: response.data.data.extractionMethod
          });
        }
      } catch (error) {
        console.error('Error loading menu data:', error);
        toast.error('Failed to load menu data');
        navigate('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, [id, location.state, navigate]);

  // Start editing an item
  const startEditing = (categoryIndex, itemIndex) => {
    const item = menuData.categories[categoryIndex].items[itemIndex];
    setEditingItem({ categoryIndex, itemIndex });
    setEditForm({
      name: item.name,
      price: item.price,
      description: item.description || ''
    });
  };

  // Save edited item
  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.price || editForm.price <= 0) {
      toast.error('Name and valid price are required');
      return;
    }

    const updatedMenuData = { ...menuData };
    updatedMenuData.categories[editingItem.categoryIndex].items[editingItem.itemIndex] = {
      ...updatedMenuData.categories[editingItem.categoryIndex].items[editingItem.itemIndex],
      name: editForm.name.trim(),
      price: parseFloat(editForm.price),
      description: editForm.description.trim()
    };

    setMenuData(updatedMenuData);
    setEditingItem(null);
    setEditForm({});
    toast.success('Item updated successfully');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  // Delete item
  const deleteItem = (categoryIndex, itemIndex) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedMenuData = { ...menuData };
      updatedMenuData.categories[categoryIndex].items.splice(itemIndex, 1);
      
      // Remove category if it becomes empty
      if (updatedMenuData.categories[categoryIndex].items.length === 0) {
        updatedMenuData.categories.splice(categoryIndex, 1);
      }
      
      setMenuData(updatedMenuData);
      toast.success('Item deleted successfully');
    }
  };

  // Add new item to category
  const addNewItem = (categoryIndex) => {
    const updatedMenuData = { ...menuData };
    updatedMenuData.categories[categoryIndex].items.push({
      name: 'New Item',
      price: 0,
      description: ''
    });
    setMenuData(updatedMenuData);
    
    // Start editing the new item
    const newItemIndex = updatedMenuData.categories[categoryIndex].items.length - 1;
    startEditing(categoryIndex, newItemIndex);
  };

  // Add new category
  const addNewCategory = () => {
    const updatedMenuData = { ...menuData };
    updatedMenuData.categories.push({
      name: 'New Category',
      items: []
    });
    setMenuData(updatedMenuData);
    toast.success('New category added');
  };

  // Edit category name
  const editCategoryName = (categoryIndex, newName) => {
    if (!newName.trim()) return;
    
    const updatedMenuData = { ...menuData };
    updatedMenuData.categories[categoryIndex].name = newName.trim();
    setMenuData(updatedMenuData);
  };

  // Delete category
  const deleteCategory = (categoryIndex) => {
    if (window.confirm('Are you sure you want to delete this entire category?')) {
      const updatedMenuData = { ...menuData };
      updatedMenuData.categories.splice(categoryIndex, 1);
      setMenuData(updatedMenuData);
      toast.success('Category deleted successfully');
    }
  };

  // Save menu to MenuItem collection
  const saveToMenuItems = async () => {
    try {
      setSaving(true);
      
      // Convert to MenuItem format and save each item
      const menuItems = [];
      
      menuData.categories.forEach(category => {
        category.items.forEach(item => {
          menuItems.push({
            name: item.name,
            description: item.description,
            price: item.price,
            category: category.name.toLowerCase().replace(/\s+/g, '-'),
            isAvailable: true,
            isVeg: false, // Default values - can be enhanced
            isSpicy: false,
            isPopular: false,
            ingredients: [],
            cookingTime: 15,
            customizations: []
          });
        });
      });

      // Save using existing menu batch endpoint
      await api.post('/menu/batch', { items: menuItems });
      
      // Update the extracted menu status
      await api.put(`/uploadMenu/${id}`, {
        processingStatus: 'completed',
        notes: 'Successfully imported to menu items'
      });

      toast.success(`${menuItems.length} menu items saved successfully!`);
      navigate('/admin/menu-management');
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save menu items: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Update extracted menu data
  const updateExtractedMenu = async () => {
    try {
      setSaving(true);
      await api.put(`/uploadMenu/${id}`, menuData);
      toast.success('Menu data updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update menu data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading menu data...</p>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Menu data not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Review Extracted Menu
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {menuData.title}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/admin/menu-upload')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Back to Upload
              </button>
              
              <button
                onClick={updateExtractedMenu}
                disabled={saving}
                className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4 inline mr-2" />
                Save Changes
              </button>
              
              <button
                onClick={saveToMenuItems}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Import to Menu</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalCategories}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalItems}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {stats.confidence}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Method</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {stats.extractionMethod?.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Menu Categories */}
        <div className="space-y-6">
          {menuData.categories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => editCategoryName(categoryIndex, e.target.value)}
                    className="text-xl font-bold text-white bg-transparent border-none outline-none placeholder-purple-200"
                    placeholder="Category Name"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-200 text-sm">
                      {category.items.length} items
                    </span>
                    
                    <button
                      onClick={() => addNewItem(categoryIndex)}
                      className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Add new item"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteCategory(categoryIndex)}
                      className="p-2 text-white hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Items */}
              <div className="p-6">
                {category.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items in this category</p>
                    <button
                      onClick={() => addNewItem(categoryIndex)}
                      className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Add first item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <motion.div
                        key={itemIndex}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        layout
                      >
                        {editingItem?.categoryIndex === categoryIndex && editingItem?.itemIndex === itemIndex ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Edit Item
                              </h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveEdit}
                                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                >
                                  <Save className="h-4 w-4 inline mr-1" />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                                >
                                  <X className="h-4 w-4 inline mr-1" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Item Name *
                                </label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Price *
                                </label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                              </label>
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Optional description..."
                              />
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {item.name}
                                </h4>
                                <span className="text-lg font-bold text-green-600">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                              
                              {item.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => startEditing(categoryIndex, itemIndex)}
                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                title="Edit item"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => deleteItem(categoryIndex, itemIndex)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Add New Category Button */}
          <motion.button
            onClick={addNewCategory}
            className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-8 w-8 text-gray-400 group-hover:text-purple-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-purple-600 font-medium">
              Add New Category
            </p>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default MenuReviewPage;
