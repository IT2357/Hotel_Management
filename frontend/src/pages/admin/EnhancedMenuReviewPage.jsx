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
  Loader2,
  Check,
  Square,
  CheckSquare,
  ShoppingCart,
  Star,
  Utensils,
  ArrowLeft,
  Filter,
  Search,
  Settings
} from 'lucide-react';
import api from '../../services/api';

const EnhancedMenuReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [categoryMappings, setCategoryMappings] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [aiCorrections, setAiCorrections] = useState(true);
  const [culturalContext, setCulturalContext] = useState('colombo');

  // Load menu data for selection
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/menu-selection/${id}`);
        setMenuData(response.data.data);
        
        // Initialize category mappings
        const mappings = {};
        response.data.data.categories.forEach(category => {
          mappings[category.name] = category.name;
        });
        setCategoryMappings(mappings);
        
      } catch (error) {
        console.error('Error loading menu data:', error);
        toast.error('Failed to load menu data');
        navigate('/admin/menu-upload');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadMenuData();
    }
  }, [id, navigate]);

  // Handle item selection
  const handleItemSelection = (categoryName, itemIndex, selected) => {
    const itemKey = `${categoryName}-${itemIndex}`;
    
    if (selected) {
      setSelectedItems(prev => [...prev, { categoryName, itemIndex, itemKey }]);
    } else {
      setSelectedItems(prev => prev.filter(item => item.itemKey !== itemKey));
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      const allItems = [];
      menuData.categories.forEach(category => {
        category.items.forEach((item, index) => {
          allItems.push({
            categoryName: category.name,
            itemIndex: index,
            itemKey: `${category.name}-${index}`
          });
        });
      });
      setSelectedItems(allItems);
    }
    setSelectAll(!selectAll);
  };

  // Check if item is selected
  const isItemSelected = (categoryName, itemIndex) => {
    const itemKey = `${categoryName}-${itemIndex}`;
    return selectedItems.some(item => item.itemKey === itemKey);
  };

  // Handle category mapping change
  const handleCategoryMapping = (originalName, newName) => {
    setCategoryMappings(prev => ({
      ...prev,
      [originalName]: newName
    }));
  };

  // Handle item editing
  const handleEditItem = (categoryName, itemIndex) => {
    const category = menuData.categories.find(cat => cat.name === categoryName);
    const item = category.items[itemIndex];
    
    setEditForm({
      categoryName,
      itemIndex,
      name: item.name,
      description: item.description,
      price: item.price,
      isVeg: item.customizations?.isVeg || false,
      isSpicy: item.customizations?.isSpicy || false,
      isPopular: item.customizations?.isPopular || false,
      isAvailable: item.customizations?.isAvailable !== false
    });
    setEditingItem(`${categoryName}-${itemIndex}`);
  };

  // Save item edits
  const handleSaveEdit = async () => {
    try {
      await api.put(`/menu-selection/${id}/item/${editForm.categoryName}/${editForm.itemIndex}`, {
        name: editForm.name,
        description: editForm.description,
        price: parseFloat(editForm.price),
        customizations: {
          isVeg: editForm.isVeg,
          isSpicy: editForm.isSpicy,
          isPopular: editForm.isPopular,
          isAvailable: editForm.isAvailable
        }
      });

      // Update local data
      setMenuData(prev => {
        const updated = { ...prev };
        const categoryIndex = updated.categories.findIndex(cat => cat.name === editForm.categoryName);
        const item = updated.categories[categoryIndex].items[editForm.itemIndex];
        
        item.name = editForm.name;
        item.description = editForm.description;
        item.price = parseFloat(editForm.price);
        item.customizations = {
          ...item.customizations,
          isVeg: editForm.isVeg,
          isSpicy: editForm.isSpicy,
          isPopular: editForm.isPopular,
          isAvailable: editForm.isAvailable
        };
        
        return updated;
      });

      setEditingItem(null);
      setEditForm({});
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  // Save selected items to MenuItem collection
  const handleSaveSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to save');
      return;
    }

    try {
      setSaving(true);
      
      const response = await api.post('/menu-selection/save-selected', {
        menuId: id,
        selectedItems,
        categoryMappings,
        aiCorrections,
        culturalContext
      });

      toast.success(`Successfully saved ${response.data.data.savedCount} menu items!`);
      
      // Navigate to admin dashboard or menu management
      navigate('/admin/food-menu-management', {
        state: { 
          message: `${response.data.data.savedCount} items added to menu`,
          newItems: response.data.data.items
        }
      });
      
    } catch (error) {
      console.error('Error saving selected items:', error);
      toast.error(error.response?.data?.message || 'Failed to save selected items');
    } finally {
      setSaving(false);
    }
  };

  // Filter items based on search and category
  const getFilteredCategories = () => {
    if (!menuData) return [];
    
    return menuData.categories.filter(category => {
      if (filterCategory !== 'all' && category.name !== filterCategory) {
        return false;
      }
      
      if (searchTerm) {
        return category.items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return true;
    }).map(category => ({
      ...category,
      items: category.items.filter(item => 
        !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading extracted menu...</p>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">Menu data not found</p>
          <button
            onClick={() => navigate('/admin/menu-upload')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const filteredCategories = getFilteredCategories();
  const totalItems = menuData.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const selectedCount = selectedItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/menu-upload')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">🤖 AI-Enhanced Menu Review & Selection</h1>
                <p className="text-gray-300 mt-1">
                  Select items to add to your restaurant menu • {totalItems} items extracted
                  {aiCorrections && (
                    <span className="ml-2 px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                      AI Food ID: {culturalContext.toUpperCase()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Selected Items</p>
                <p className="text-2xl font-bold text-purple-400">{selectedCount}</p>
              </div>
              
              <button
                onClick={handleSaveSelected}
                disabled={selectedCount === 0 || saving}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Selected ({selectedCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {menuData.categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Corrections & Cultural Context */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="aiCorrections"
                  checked={aiCorrections}
                  onChange={(e) => setAiCorrections(e.target.checked)}
                  className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="aiCorrections" className="text-sm text-purple-300">
                  🤖 AI Food Identification
                </label>
              </div>
              
              <select
                value={culturalContext}
                onChange={(e) => setCulturalContext(e.target.value)}
                className="px-3 py-1 bg-gray-800/50 border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="colombo">🏙️ Colombo</option>
                <option value="jaffna">🌴 Jaffna Tamil</option>
                <option value="kandy">⛰️ Kandy</option>
                <option value="galle">🏖️ Galle</option>
              </select>

              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/30 transition-colors"
              >
                {selectAll ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                    <p className="text-gray-300 mt-1">{category.items.length} items</p>
                  </div>
                  
                  {/* Category Mapping */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Map to:</span>
                    <select
                      value={categoryMappings[category.name] || category.name}
                      onChange={(e) => handleCategoryMapping(category.name, e.target.value)}
                      className="px-3 py-1 bg-gray-800/50 border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value={category.name}>{category.name} (New)</option>
                      {menuData.existingCategories?.map(existingCat => (
                        <option key={existingCat.slug} value={existingCat.name}>
                          {existingCat.name} (Existing)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => {
                    const isSelected = isItemSelected(category.name, itemIndex);
                    const isEditing = editingItem === `${category.name}-${itemIndex}`;
                    
                    return (
                      <motion.div
                        key={itemIndex}
                        layout
                        className={`relative bg-gray-800/30 rounded-lg border-2 transition-all duration-200 ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-3 left-3 z-10">
                          <button
                            onClick={() => handleItemSelection(category.name, itemIndex, !isSelected)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-gray-400 hover:border-purple-400'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Edit Button */}
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => handleEditItem(category.name, itemIndex)}
                            className="w-8 h-8 bg-gray-700/80 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-600/80 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Item Image */}
                        <div className="aspect-video bg-gray-700 rounded-t-lg overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Utensils className="w-12 h-12 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="p-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-500 focus:outline-none"
                                placeholder="Item name"
                              />
                              
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-500 focus:outline-none resize-none"
                                rows="2"
                                placeholder="Description"
                              />
                              
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.price}
                                onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-500 focus:outline-none"
                                placeholder="Price"
                              />
                              
                              {/* Checkboxes */}
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { key: 'isVeg', label: 'Vegetarian' },
                                  { key: 'isSpicy', label: 'Spicy' },
                                  { key: 'isPopular', label: 'Popular' },
                                  { key: 'isAvailable', label: 'Available' }
                                ].map(({ key, label }) => (
                                  <label key={key} className="flex items-center space-x-2 text-sm text-gray-300">
                                    <input
                                      type="checkbox"
                                      checked={editForm[key]}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, [key]: e.target.checked }))}
                                      className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>{label}</span>
                                  </label>
                                ))}
                              </div>
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                                >
                                  <Save className="w-4 h-4" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItem(null);
                                    setEditForm({});
                                  }}
                                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-white text-lg mb-2">{item.name}</h3>
                              {item.description && (
                                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{item.description}</p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-purple-400">
                                  ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                                </span>
                                
                                <div className="flex items-center space-x-2">
                                  {item.customizations?.isVeg && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Veg</span>
                                  )}
                                  {item.customizations?.isSpicy && (
                                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Spicy</span>
                                  )}
                                  {item.customizations?.isPopular && (
                                    <Star className="w-4 h-4 text-yellow-400" />
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-purple-500/20 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-white">
              <p className="text-lg font-semibold">{selectedCount} items selected</p>
              <p className="text-sm text-gray-400">Ready to add to your menu</p>
            </div>
            
            <button
              onClick={handleSaveSelected}
              disabled={selectedCount === 0 || saving}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving to Menu...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Menu ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMenuReviewPage;
