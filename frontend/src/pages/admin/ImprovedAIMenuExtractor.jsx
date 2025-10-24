import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Camera,
  Loader2,
  Check,
  X,
  Edit3,
  Save,
  Trash2,
  Download,
  Eye,
  Zap,
  Brain
} from 'lucide-react';
import FoodButton from '@/components/food/FoodButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/food/FoodCard';
import FoodBadge from '@/components/food/FoodBadge';
import FoodInput from '@/components/food/FoodInput';
import FoodLabel from '@/components/food/FoodLabel';
import FoodSelect from '@/components/food/FoodSelect';
import { toast } from 'sonner';
import api from '@/services/api';
import foodService from '@/services/foodService';

const ImprovedAIMenuExtractor = () => {
  const [loading, setLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [categories, setCategories] = useState([]);
  
  const fileInputRef = useRef(null);

  // Load categories on mount
  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await foodService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, or WEBP)');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Extract menu from image
  const onExtract = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Analyzing menu image with AI...', { id: 'extract' });

      // Create form data
      const formData = new FormData();
      formData.append('image', imageFile);

      // Call the extraction API
      const response = await api.post('/food-complete/ai/extract', formData);

      // Extract menu items from response
      const menuItems = response.data.data?.menuItems || response.data.menuItems || [];
      
      setExtractedItems(menuItems);
      setSelectedItems(menuItems.map((_, idx) => idx)); // Select all by default
      
      toast.success(`Extracted ${menuItems.length} items from menu!`, { id: 'extract' });
      
      if (menuItems.length === 0) {
        toast.warning('No menu items found. Try a clearer image.');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to extract menu';
      toast.error(errorMessage, { id: 'extract' });
    } finally {
      setLoading(false);
    }
  };

  // Save selected items to menu
  const onSaveToMenu = async () => {
    const itemsToSave = extractedItems.filter((_, idx) => selectedItems.includes(idx));
    
    if (itemsToSave.length === 0) {
      toast.warning('Please select at least one item to add');
      return;
    }

    try {
      setSaving(true);
      
      // Save each item individually
      for (const item of itemsToSave) {
        const menuItemData = {
          name: item.name_english || item.name || 'Unnamed Item',
          description: item.description_english || item.description || '',
          price: parseFloat(item.price) || 0,
          category: categories[0]?._id || '', // Default to first category
          ingredients: item.ingredients || [],
          dietaryTags: item.dietaryTags || [],
          isVeg: item.isVeg || false,
          isSpicy: item.isSpicy || false,
          culturalContext: item.culturalContext || '',
          isAvailable: true
        };

        await foodService.createMenuItem(menuItemData);
      }

      toast.success(`${itemsToSave.length} items added to menu!`);
      
      // Reset form
      setExtractedItems([]);
      setSelectedItems([]);
      clearImage();
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save items to menu';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (index) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedItems.length === extractedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(extractedItems.map((_, idx) => idx));
    }
  };

  // Start editing an item
  const startEditing = (item, index) => {
    setEditingItem(index);
    setEditForm({
      name: item.name_english || item.name || '',
      description: item.description_english || item.description || '',
      price: item.price || 0,
      isVeg: item.isVeg || false,
      isSpicy: item.isSpicy || false
    });
  };

  // Save edited item
  const saveEdit = (index) => {
    setExtractedItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          name_english: editForm.name,
          description_english: editForm.description,
          price: editForm.price,
          isVeg: editForm.isVeg,
          isSpicy: editForm.isSpicy
        };
      }
      return item;
    }));
    setEditingItem(null);
    setEditForm({});
    toast.success('Item updated');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({});
  };

  // Delete item
  const deleteItem = (index) => {
    setExtractedItems(prev => prev.filter((_, idx) => idx !== index));
    setSelectedItems(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    toast.success('Item removed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Menu Extractor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Extract menu items from images using advanced AI - Just like Google Lens
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Image Upload */}
          <Card className="h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                Upload Menu Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="space-y-4">
                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
                  >
                    <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Click to upload menu image
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      JPEG, PNG, or WEBP (max 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={imagePreview}
                      alt="Menu preview"
                      className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-3 right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Extract Button */}
                {imagePreview && (
                  <FoodButton
                    onClick={onExtract}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Image with AI...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5 mr-2" />
                        Extract Menu Items
                      </>
                    )}
                  </FoodButton>
                )}
              </div>

              {/* AI Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Features</h3>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
                  <li>• OCR with Tesseract.js for text extraction</li>
                  <li>• Supports Tamil, English, and multilingual menus</li>
                  <li>• Automatic price detection (LKR, Rs.)</li>
                  <li>• Dietary tag recognition (Veg, Spicy, Halal)</li>
                  <li>• Smart category detection</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Extracted Items */}
          <div className="space-y-4">
            {extractedItems.length > 0 && (
              <>
                {/* Action Bar */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <FoodBadge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {extractedItems.length} items extracted
                        </FoodBadge>
                        <FoodBadge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {selectedItems.length} selected
                        </FoodBadge>
                      </div>
                      <div className="flex items-center gap-2">
                        <FoodButton
                          onClick={toggleSelectAll}
                          variant="outline"
                          size="sm"
                        >
                          {selectedItems.length === extractedItems.length ? 'Deselect All' : 'Select All'}
                        </FoodButton>
                        <FoodButton
                          onClick={onSaveToMenu}
                          disabled={saving || selectedItems.length === 0}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save to Menu
                            </>
                          )}
                        </FoodButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Extracted Items List */}
                <div className="space-y-3">
                  {extractedItems.map((item, index) => (
                    <Card
                      key={index}
                      className={`transition-all ${
                        selectedItems.includes(index)
                          ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                          : 'hover:shadow-md'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(index)}
                            onChange={() => toggleItemSelection(index)}
                            className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />

                          {/* Item Content */}
                          <div className="flex-1 min-w-0">
                            {editingItem === index ? (
                              // Edit Mode
                              <div className="space-y-3">
                                <FoodInput
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  placeholder="Item name"
                                  className="font-semibold"
                                />
                                <FoodInput
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  placeholder="Description"
                                />
                                <FoodInput
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                  placeholder="Price"
                                />
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={editForm.isVeg}
                                      onChange={(e) => setEditForm({ ...editForm, isVeg: e.target.checked })}
                                      className="rounded text-indigo-600"
                                    />
                                    <span className="text-sm">Vegetarian</span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={editForm.isSpicy}
                                      onChange={(e) => setEditForm({ ...editForm, isSpicy: e.target.checked })}
                                      className="rounded text-indigo-600"
                                    />
                                    <span className="text-sm">Spicy</span>
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <FoodButton onClick={() => saveEdit(index)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                    <Check className="w-4 h-4 mr-1" />
                                    Save
                                  </FoodButton>
                                  <FoodButton onClick={cancelEditing} variant="outline" size="sm">
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </FoodButton>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {item.name_english || item.name || 'Unnamed Item'}
                                    {item.name_tamil && (
                                      <span className="ml-2 text-sm text-gray-500">({item.name_tamil})</span>
                                    )}
                                  </h3>
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                    LKR {parseFloat(item.price || 0).toFixed(2)}
                                  </span>
                                </div>
                                
                                {item.description_english && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {item.description_english}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                  {item.isVeg && (
                                    <FoodBadge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                      Vegetarian
                                    </FoodBadge>
                                  )}
                                  {item.isSpicy && (
                                    <FoodBadge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">
                                      🌶️ Spicy
                                    </FoodBadge>
                                  )}
                                  {item.dietaryTags?.map((tag, i) => (
                                    <FoodBadge key={i} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                                      {tag}
                                    </FoodBadge>
                                  ))}
                                  {item.aiConfidence && (
                                    <FoodBadge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                                      {Math.round(item.aiConfidence)}% confidence
                                    </FoodBadge>
                                  )}
                                </div>

                                {item.ingredients && item.ingredients.length > 0 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <span className="font-medium">Ingredients:</span> {item.ingredients.join(', ')}
                                  </p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {editingItem !== index && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditing(item, index)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteItem(index)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {extractedItems.length === 0 && !loading && (
              <Card className="p-12">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No items extracted yet</p>
                  <p className="text-sm">Upload a menu image to get started</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedAIMenuExtractor;

