import React, { useState, useEffect } from 'react';
import {
  Save,
  Trash2,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react';
import menuApi from '../api/menuApi';

const MenuReview = ({ extractionResult, onSave, onCancel, onError }) => {
  const [menuData, setMenuData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (extractionResult?.menu) {
      setMenuData(extractionResult.menu);
      validateMenu(extractionResult.menu);
    }
  }, [extractionResult]);

  // Validate menu structure
  const validateMenu = (data) => {
    const errors = menuApi.validateMenuStructure(data);
    setValidationErrors(errors);
  };

  // Handle category name change
  const updateCategoryName = (categoryIndex, newName) => {
    const updatedData = { ...menuData };
    updatedData.categories[categoryIndex].name = newName;
    setMenuData(updatedData);
    validateMenu(updatedData);
  };

  // Handle item updates
  const updateItem = (categoryIndex, itemIndex, field, value) => {
    const updatedData = { ...menuData };
    
    if (field === 'price') {
      // Ensure price is a number
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        updatedData.categories[categoryIndex].items[itemIndex][field] = numericValue;
      }
    } else {
      updatedData.categories[categoryIndex].items[itemIndex][field] = value;
    }
    
    setMenuData(updatedData);
    validateMenu(updatedData);
  };

  // Add new item to category
  const addItem = (categoryIndex) => {
    const updatedData = { ...menuData };
    const newItem = {
      name: 'New Item',
      price: 0,
      description: '',
      image: ''
    };
    updatedData.categories[categoryIndex].items.push(newItem);
    setMenuData(updatedData);
    validateMenu(updatedData);
  };

  // Remove item from category
  const removeItem = (categoryIndex, itemIndex) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      const updatedData = { ...menuData };
      updatedData.categories[categoryIndex].items.splice(itemIndex, 1);
      setMenuData(updatedData);
      validateMenu(updatedData);
    }
  };

  // Add new category
  const addCategory = () => {
    const updatedData = { ...menuData };
    const newCategory = {
      name: 'New Category',
      items: []
    };
    updatedData.categories.push(newCategory);
    setMenuData(updatedData);
    validateMenu(updatedData);
  };

  // Remove category
  const removeCategory = (categoryIndex) => {
    if (window.confirm('Are you sure you want to remove this entire category?')) {
      const updatedData = { ...menuData };
      updatedData.categories.splice(categoryIndex, 1);
      setMenuData(updatedData);
      validateMenu(updatedData);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (validationErrors.length > 0) {
      onError?.('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const result = await menuApi.saveMenu(menuData);
      if (result.success) {
        onSave?.(result);
      } else {
        throw new Error(result.message || 'Failed to save menu');
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save menu';
      onError?.(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Export menu data as JSON
  const exportMenu = () => {
    const dataStr = JSON.stringify(menuData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `menu-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!menuData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading menu data...</span>
      </div>
    );
  }

  const totalItems = menuData.categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              📝 Review & Edit Menu
            </h2>
            <p className="text-gray-600">
              Review the extracted menu items and make any necessary corrections before saving.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">{menuData.categories.length}</div>
            <div className="text-sm text-blue-700">Categories</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">{totalItems}</div>
            <div className="text-sm text-green-700">Total Items</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">{menuData.confidence || 0}%</div>
            <div className="text-sm text-purple-700">Confidence</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-900 capitalize">
              {menuData.extractionMethod || 'Unknown'}
            </div>
            <div className="text-sm text-orange-700">Method</div>
          </div>
        </div>

        {/* Source Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Source Information</h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {menuData.source?.type || 'Unknown'}
            <span className="ml-4 font-medium">Value:</span> {menuData.source?.value || 'Unknown'}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="font-medium text-red-900">Validation Errors</h3>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Categories and Items */}
      <div className="space-y-8">
        {menuData.categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="border border-gray-200 rounded-lg p-6">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={category.name}
                onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Category Name"
              />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {category.items.length} items
                </span>
                <button
                  onClick={() => addItem(categoryIndex)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Add Item"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeCategory(categoryIndex)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Category"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Item Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(categoryIndex, itemIndex, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter item name"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItem(categoryIndex, itemIndex, 'price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-end">
                      <button
                        onClick={() => removeItem(categoryIndex, itemIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(categoryIndex, itemIndex, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="2"
                      placeholder="Enter item description"
                    />
                  </div>

                  {/* Image */}
                  {item.image && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image
                      </label>
                      {item.image.startsWith('gridfs:') ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={menuApi.getImageUrl(item.image.replace('gridfs:', ''))}
                            alt={item.name}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                          <span className="text-sm text-gray-600">GridFS Image</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">{item.image}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {category.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No items in this category</p>
                  <button
                    onClick={() => addItem(categoryIndex)}
                    className="mt-2 inline-flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Category Button */}
        <div className="text-center">
          <button
            onClick={addCategory}
            className="inline-flex items-center px-6 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Category
          </button>
        </div>
      </div>

      {/* Raw Text Section */}
      {menuData.rawText && (
        <div className="mt-8">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors mb-4"
          >
            {showRawText ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showRawText ? 'Hide' : 'Show'} Raw Extracted Text
          </button>
          
          {showRawText && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {menuData.rawText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={exportMenu}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || validationErrors.length > 0}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save to Database
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuReview;
