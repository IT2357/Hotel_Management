/**
 * 👨‍💼 AdminMenuPanel 2025 - Full-Featured Admin Dashboard
 * Features: React Table with pagination/sorting/filters, CRUD modals, bulk actions, stats cards
 * Real-world: Debounced search, image upload, bilingual Tamil/English forms, #FF9933 theme
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Eye, EyeOff, Upload, X, 
  Check, AlertCircle, ChefHat, TrendingUp, Leaf, Flame
} from 'lucide-react';
import { menuAPI, categoryAPI } from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';

const AdminMenuPanel = () => {
  // State
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('sortOrder');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name_tamil: '',
    name_english: '',
    description_tamil: '',
    description_english: '',
    price: '',
    category: '',
    ingredients: [],
    isVeg: false,
    isSpicy: false,
    isPopular: false,
    mealTime: [],
    preparationTime: '',
    image: null
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Bulk Actions
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Fetch data
  useEffect(() => {
    fetchMenuItems();
  }, [debouncedSearch, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getItems({
        search: debouncedSearch,
        page,
        limit: 10,
        sortBy,
        sortOrder
      });
      
      if (response.success) {
        setMenuItems(response.data.items);
        setTotalPages(Math.ceil(response.data.pagination.total / 10));
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await menuAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // CRUD Operations
  const handleCreate = () => {
    setModalMode('create');
    setSelectedItem(null);
    setFormData({
      name_tamil: '',
      name_english: '',
      description_tamil: '',
      description_english: '',
      price: '',
      category: '',
      ingredients: [],
      isVeg: false,
      isSpicy: false,
      isPopular: false,
      mealTime: [],
      preparationTime: '',
      image: null
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormData({
      name_tamil: item.name_tamil || '',
      name_english: item.name_english || '',
      description_tamil: item.description_tamil || '',
      description_english: item.description_english || '',
      price: item.price || '',
      category: item.category?._id || '',
      ingredients: item.ingredients || [],
      isVeg: item.isVeg || false,
      isSpicy: item.isSpicy || false,
      isPopular: item.isPopular || false,
      mealTime: item.mealTime || [],
      preparationTime: item.preparationTime || '',
      image: null
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await menuAPI.deleteItem(itemId);
      fetchMenuItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await menuAPI.toggleAvailability(itemId, !currentStatus);
      fetchMenuItems();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name_tamil.trim()) errors.name_tamil = 'Tamil name required';
    if (!formData.name_english.trim()) errors.name_english = 'English name required';
    if (!formData.price || formData.price < 50) errors.price = 'Price must be at least LKR 50';
    if (!formData.category) errors.category = 'Category required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key === 'image') {
          if (formData.image) formDataToSend.append('image', formData.image);
        } else if (Array.isArray(formData[key])) {
          formData[key].forEach(item => formDataToSend.append(key, item));
        } else if (typeof formData[key] === 'boolean') {
          formDataToSend.append(key, formData[key].toString());
        } else if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (modalMode === 'create') {
        await menuAPI.createItem(formDataToSend);
      } else {
        await menuAPI.updateItem(selectedItem._id, formDataToSend);
      }
      
      setShowModal(false);
      fetchMenuItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item. Please check your inputs.');
    }
  };

  // Bulk Actions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(menuItems.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBulkToggleAvailability = async (status) => {
    try {
      await Promise.all(
        selectedItems.map(itemId => menuAPI.toggleAvailability(itemId, status))
      );
      setSelectedItems([]);
      fetchMenuItems();
    } catch (error) {
      console.error('Failed to bulk toggle availability:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <ChefHat className="w-10 h-10 text-[#FF9933]" />
            Menu Management
          </h1>
          <p className="text-gray-600">Manage your Jaffna restaurant menu items</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#FF9933]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalItems}</p>
                </div>
                <ChefHat className="w-12 h-12 text-[#FF9933]/20" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.availablePercentage}%
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vegetarian</p>
                  <p className="text-3xl font-bold text-green-600">{stats.vegCount}</p>
                </div>
                <Leaf className="w-12 h-12 text-green-200" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Spicy Dishes</p>
                  <p className="text-3xl font-bold text-red-600">{stats.spicyCount}</p>
                </div>
                <Flame className="w-12 h-12 text-red-200" />
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={handleCreate}
              className="w-full sm:w-auto px-6 py-3 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF7700] transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add New Item
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {selectedItems.length} selected
              </span>
              <button
                onClick={() => handleBulkToggleAvailability(true)}
                className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
              >
                Enable All
              </button>
              <button
                onClick={() => handleBulkToggleAvailability(false)}
                className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
              >
                Disable All
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#FF9933] to-[#FF7700] text-white">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === menuItems.length && menuItems.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Image</th>
                  <th className="px-4 py-3 text-left">Name (Tamil)</th>
                  <th className="px-4 py-3 text-left">Name (English)</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Tags</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : menuItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                      No menu items found
                    </td>
                  </tr>
                ) : (
                  menuItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                          className="w-5 h-5 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={item.imageUrl || '/placeholder-food.jpg'}
                          alt={item.name_english}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.name_tamil || '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.name_english}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.category?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-semibold">
                        LKR {item.price}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.isAvailable
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {item.isVeg && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Veg
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Spicy
                            </span>
                          )}
                          {item.isPopular && (
                            <span className="px-2 py-1 bg-[#FF9933]/20 text-[#FF9933] text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="min-h-screen px-4 py-8 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#FF9933] to-[#FF7700] px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {modalMode === 'create' ? 'Add New Item' : 'Edit Item'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Tamil Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamil Name (தமிழ் பெயர்) *
                    </label>
                    <input
                      type="text"
                      value={formData.name_tamil}
                      onChange={(e) => setFormData({ ...formData, name_tamil: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-lg ${
                        formErrors.name_tamil ? 'border-red-500' : 'border-gray-200'
                      } focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20`}
                      placeholder="e.g., நண்டு கறி"
                    />
                    {formErrors.name_tamil && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.name_tamil}</p>
                    )}
                  </div>

                  {/* English Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      English Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name_english}
                      onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-lg ${
                        formErrors.name_english ? 'border-red-500' : 'border-gray-200'
                      } focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20`}
                      placeholder="e.g., Crab Curry"
                    />
                    {formErrors.name_english && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.name_english}</p>
                    )}
                  </div>

                  {/* Descriptions in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamil Description
                      </label>
                      <textarea
                        value={formData.description_tamil}
                        onChange={(e) => setFormData({ ...formData, description_tamil: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        English Description
                      </label>
                      <textarea
                        value={formData.description_english}
                        onChange={(e) => setFormData({ ...formData, description_english: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20"
                      />
                    </div>
                  </div>

                  {/* Price & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (LKR) *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-lg ${
                          formErrors.price ? 'border-red-500' : 'border-gray-200'
                        } focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20`}
                        placeholder="e.g., 850"
                        min="50"
                      />
                      {formErrors.price && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-lg ${
                          formErrors.category ? 'border-red-500' : 'border-gray-200'
                        } focus:border-[#FF9933] focus:ring-2 focus:ring-[#FF9933]/20`}
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                      {formErrors.category && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
                      )}
                    </div>
                  </div>

                  {/* Dietary Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Dietary Tags
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isVeg}
                          onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                          className="w-5 h-5 text-[#FF9933] rounded"
                        />
                        <span className="text-gray-700">Vegetarian</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isSpicy}
                          onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                          className="w-5 h-5 text-[#FF9933] rounded"
                        />
                        <span className="text-gray-700">Spicy</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPopular}
                          onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                          className="w-5 h-5 text-[#FF9933] rounded"
                        />
                        <span className="text-gray-700">Popular</span>
                      </label>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FF9933] transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer text-[#FF9933] hover:underline"
                      >
                        Click to upload image
                      </label>
                      {formData.image && (
                        <p className="text-sm text-gray-600 mt-2">{formData.image.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF7700] transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {modalMode === 'create' ? 'Create Item' : 'Update Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMenuPanel;
