import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Edit3,
  Save,
  X,
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
  Settings,
  Camera,
  Zap,
  Target,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink
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
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);

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

  // Handle item details view
  const handleItemDetails = (categoryName, itemIndex) => {
    const category = menuData.categories.find(cat => cat.name === categoryName);
    const item = category.items[itemIndex];

    setSelectedItemDetails({
      ...item,
      categoryName,
      itemIndex,
      image: menuData.imageUrl || item.image
    });
    setShowDetails(true);
  };

  // Close item details
  const closeItemDetails = () => {
    setShowDetails(false);
    setSelectedItemDetails(null);
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
                <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                  <Camera className="w-8 h-8 text-purple-400" />
                  <span>Google Lens Food Analysis</span>
                </h1>
                <p className="text-gray-300 mt-1">
                  AI-powered food recognition • {totalItems} dishes detected
                  <span className="ml-2 px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded">
                    {menuData?.extractionMethod?.toUpperCase() || 'AI-ANALYZED'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Selected for Menu</p>
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
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Menu ({selectedCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google Lens-like Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Image Analysis (Google Lens style) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analyzed Image Display - Google Lens Style */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden">
              <div className="p-4 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Google Lens Analysis</h2>
                    <span className="px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded">
                      {menuData?.extractionMethod?.replace('-', ' ').toUpperCase() || 'AI ANALYSIS'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Confidence:</span>
                    <span className="text-lg font-bold text-green-400">{menuData?.confidence || 95}%</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Display the actual uploaded image */}
                {menuData?.imageUrl ? (
                  <div className="relative">
                    <img
                      src={menuData.imageUrl}
                      alt="Analyzed Menu"
                      className="w-full aspect-video object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://dummyimage.com/800x400/cccccc/000000&text=Menu+Image+Not+Found';
                      }}
                    />

                    {/* Floating AI Analysis Indicators */}
                    <div className="absolute top-4 right-4 space-y-2">
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <Target className="w-4 h-4 text-green-400" />
                          <span>Objects Detected</span>
                        </div>
                      </div>
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <span>AI Processing</span>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Stats Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{menuData?.categories?.length || 0}</div>
                            <div className="text-xs text-gray-300">Categories</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{totalItems}</div>
                            <div className="text-xs text-gray-300">Items Found</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{selectedCount}</div>
                            <div className="text-xs text-gray-300">Selected</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="relative">
                        <Camera className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                        {/* AI Detection Animation */}
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
                            <Zap className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Menu Image Analyzed</h3>
                      <p className="text-gray-300 mb-4">AI has successfully identified {totalItems} dishes from your menu image</p>

                      {/* Analysis Stats */}
                      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="bg-black/40 rounded-lg p-3">
                          <div className="text-2xl font-bold text-purple-400">{menuData?.categories?.length || 0}</div>
                          <div className="text-xs text-gray-400">Categories</div>
                        </div>
                        <div className="bg-black/40 rounded-lg p-3">
                          <div className="text-2xl font-bold text-green-400">{totalItems}</div>
                          <div className="text-xs text-gray-400">Items Found</div>
                        </div>
                        <div className="bg-black/40 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-400">{selectedCount}</div>
                          <div className="text-xs text-gray-400">Selected</div>
                        </div>
                      </div>
                    </div>

                    {/* Floating AI Analysis Indicators */}
                    <div className="absolute top-4 right-4 space-y-2">
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <Target className="w-4 h-4 text-green-400" />
                          <span>Objects Detected</span>
                        </div>
                      </div>
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <span>AI Processing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Detection Results - Google Lens Style */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20">
              <div className="p-4 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Detected Food Items</h2>
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded">
                      {totalItems} found
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectAll
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
                      }`}
                    >
                      {selectAll ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-600/20 text-gray-300 rounded text-sm hover:bg-gray-600/30 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                      <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Category-based organization */}
                <div className="space-y-6">
                  {menuData?.categories?.map((category, catIndex) => (
                    <div key={category.name} className="space-y-3">
                      {/* Category Header */}
                      <div className="flex items-center space-x-2">
                        <h3 className="text-md font-semibold text-white">{category.name}</h3>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {category.items?.length || 0} items
                        </span>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.items?.map((item, itemIndex) => {
                          const isSelected = isItemSelected(category.name, itemIndex);
                          const globalIndex = menuData.categories.slice(0, catIndex).reduce((sum, cat) => sum + cat.items.length, 0) + itemIndex;

                          return (
                            <motion.div
                              key={`${category.name}-${itemIndex}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: globalIndex * 0.03 }}
                              className={`relative bg-gray-800/50 rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                                  : 'border-gray-600 hover:border-purple-400 hover:bg-purple-500/5'
                              }`}
                              onClick={() => handleItemDetails(category.name, itemIndex)}
                            >
                              {/* Selection Checkbox */}
                              <div className="absolute top-2 left-2 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemSelection(category.name, itemIndex, !isSelected);
                                  }}
                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'bg-purple-600 border-purple-600 text-white shadow-lg'
                                      : 'border-gray-400 hover:border-purple-400 bg-black/50'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </button>
                              </div>

                              {/* Item Number Badge */}
                              <div className="absolute top-2 right-2 z-10">
                                <span className="px-2 py-1 bg-black/70 text-white text-xs rounded font-mono backdrop-blur-sm">
                                  #{globalIndex + 1}
                                </span>
                              </div>

                              {/* AI Confidence Indicator */}
                              <div className="absolute bottom-2 left-2 z-10">
                                <div className="flex items-center space-x-1 bg-black/70 rounded px-2 py-1 backdrop-blur-sm">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-white font-medium">
                                    {item.confidence || 95}%
                                  </span>
                                </div>
                              </div>

                              {/* Item Content */}
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-white text-sm flex-1 line-clamp-1">
                                    {item.name}
                                  </h4>
                                  <span className="text-purple-400 font-bold text-sm ml-2">
                                    ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                                  </span>
                                </div>

                                <p className="text-gray-300 text-xs mb-3 line-clamp-2">
                                  {item.description || 'AI-detected food item with traditional preparation'}
                                </p>

                                {/* Item Tags */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.isVeg && (
                                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                      Vegetarian
                                    </span>
                                  )}
                                  {item.isSpicy && (
                                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                      Spicy
                                    </span>
                                  )}
                                  {item.isPopular && (
                                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                      Popular
                                    </span>
                                  )}
                                </div>

                                {/* Tamil Name if available */}
                                {item.tamilName && (
                                  <div className="text-purple-300 text-xs font-medium">
                                    {item.tamilName}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Controls & Details */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSelectAll}
                  className="w-full flex items-center justify-between px-4 py-3 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/30 transition-colors"
                >
                  <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
                  {selectAll ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {menuData?.categories?.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Analysis Summary */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Analysis Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Dishes</span>
                  <span className="text-white font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Selected</span>
                  <span className="text-purple-400 font-semibold">{selectedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Categories</span>
                  <span className="text-white font-semibold">{menuData?.categories?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">AI Method</span>
                  <span className="text-green-400 text-sm">
                    {menuData?.extractionMethod === 'openai-vision' ? 'OpenAI Vision' :
                     menuData?.extractionMethod === 'google-vision' ? 'Google AI' :
                     'AI Analysis'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cultural Context */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cultural Context</h3>
              <select
                value={culturalContext}
                onChange={(e) => setCulturalContext(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="colombo">🏙️ Colombo (Urban)</option>
                <option value="jaffna">🌴 Jaffna Tamil (Traditional)</option>
                <option value="kandy">⛰️ Kandy (Hill Country)</option>
                <option value="galle">🏖️ Galle (Coastal)</option>
              </select>
              <p className="text-xs text-gray-400 mt-2">
                AI considers regional cuisine preferences and pricing
              </p>
            </div>
          </div>
        </div>

        {/* Item Details Modal */}
        <AnimatePresence>
          {showDetails && selectedItemDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeItemDetails}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 rounded-xl border border-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">AI Analysis Details</h3>
                    <button
                      onClick={closeItemDetails}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Item Image */}
                    <div>
                      {selectedItemDetails.image ? (
                        <img
                          src={selectedItemDetails.image}
                          alt={selectedItemDetails.name}
                          className="w-full rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = 'https://dummyimage.com/400x300/cccccc/000000&text=Analyzed+Food';
                          }}
                        />
                      ) : (
                        <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                          <Utensils className="w-16 h-16 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">{selectedItemDetails.name}</h4>
                        {selectedItemDetails.tamilName && (
                          <p className="text-purple-300 text-sm mb-2">{selectedItemDetails.tamilName}</p>
                        )}
                        <p className="text-gray-300 text-sm">{selectedItemDetails.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-400">Price</span>
                          <p className="text-2xl font-bold text-purple-400">
                            ${typeof selectedItemDetails.price === 'number' ? selectedItemDetails.price.toFixed(2) : selectedItemDetails.price}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Confidence</span>
                          <p className="text-lg font-semibold text-green-400">
                            {selectedItemDetails.confidence || 85}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {selectedItemDetails.isVeg && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Vegetarian</span>
                          )}
                          {selectedItemDetails.isSpicy && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Spicy</span>
                          )}
                          {selectedItemDetails.isPopular && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Popular</span>
                          )}
                        </div>

                        {selectedItemDetails.ingredients && selectedItemDetails.ingredients.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-400">Ingredients</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedItemDetails.ingredients.map((ingredient, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedItemDetails.nutritionalInfo && (
                          <div>
                            <span className="text-sm text-gray-400">Nutrition (per serving)</span>
                            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                              <div>Calories: {selectedItemDetails.nutritionalInfo.calories || 'N/A'}</div>
                              <div>Protein: {selectedItemDetails.nutritionalInfo.protein || 'N/A'}g</div>
                              <div>Carbs: {selectedItemDetails.nutritionalInfo.carbs || 'N/A'}g</div>
                              <div>Fat: {selectedItemDetails.nutritionalInfo.fat || 'N/A'}g</div>
                            </div>
                          </div>
                        )}

                        {selectedItemDetails.cookingTime && (
                          <div>
                            <span className="text-sm text-gray-400">Cooking Time</span>
                            <p className="text-white">{selectedItemDetails.cookingTime} minutes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedMenuReviewPage;
