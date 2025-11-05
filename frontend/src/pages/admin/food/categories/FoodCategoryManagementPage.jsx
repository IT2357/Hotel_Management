import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Tag
} from 'lucide-react';
import FoodButton from '@/components/food/FoodButton';
import FoodInput from '@/components/food/FoodInput';
import FoodLabel from '@/components/food/FoodLabel';
import FoodTextarea from '@/components/food/FoodTextarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/food/FoodCard';
import FoodBadge from '@/components/food/FoodBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/food/FoodDialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

const FoodCategoryManagementPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#FF9933',
    icon: '🍽️',
    isActive: true,
    sortOrder: 0
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [Categories] Fetching from /food/categories');
      const response = await api.get('/food/categories');  // ✅ FIXED: Correct endpoint
      console.log('✅ [Categories] Response:', response.data);
      setCategories(response.data?.data || response.data || []);
    } catch (error) {
      console.error('❌ [Categories] Error fetching:', error);
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.color) {
      errors.color = 'Color is required';
    }
    
    if (!formData.icon) {
      errors.icon = 'Icon is required';
    }
    
    if (formData.sortOrder < 0) {
      errors.sortOrder = 'Sort order must be 0 or greater';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/update category
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const categoryData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim()
      };

      if (editingCategory) {
        // Update existing category
        console.log('🔍 [Categories] Updating category:', editingCategory._id);
        const response = await api.put(`/food/categories/${editingCategory._id}`, categoryData);  // ✅ FIXED
        console.log('✅ [Categories] Update response:', response.data);
        setCategories(prev => prev.map(cat => 
          cat._id === editingCategory._id ? (response.data.data || response.data) : cat
        ));
        toast.success('Category updated successfully');
      } else {
        // Create new category
        console.log('🔍 [Categories] Creating category');
        const response = await api.post('/food/categories', categoryData);  // ✅ FIXED
        console.log('✅ [Categories] Create response:', response.data);
        setCategories(prev => [...prev, (response.data.data || response.data)]);
        toast.success('Category created successfully');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#FF9933',
        icon: '🍽️',
        isActive: true,
        sortOrder: 0
      });
      setShowCreateForm(false);
      setEditingCategory(null);
      setFormErrors({});

    } catch (error) {
      console.error('Error saving category:', error);
      setError(error.response?.data?.message || 'Failed to save category');
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit category
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color || '#FF9933',
      icon: category.icon || '🍽️',
      isActive: category.isActive !== false,
      sortOrder: category.sortOrder || 0
    });
    setShowCreateForm(true);
  };

  // Handle delete category
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/menu/categories/${categoryId}`);
      setCategories(prev => prev.filter(cat => cat._id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (category) => {
    try {
      const updatedCategory = { ...category, isActive: !category.isActive };
      await api.put(`/menu/categories/${category._id}`, updatedCategory);
      setCategories(prev => prev.map(cat => 
        cat._id === category._id ? updatedCategory : cat
      ));
      toast.success(`Category ${updatedCategory.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating category status:', error);
      toast.error('Failed to update category status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#FF9933',
      icon: '🍽️',
      isActive: true,
      sortOrder: 0
    });
    setEditingCategory(null);
    setShowCreateForm(false);
    setFormErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <FoodButton
                variant="ghost"
                onClick={() => navigate('/admin/food/menu')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </FoodButton>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF9933] rounded-xl flex items-center justify-center">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#4A4A4A]">Food Categories</h1>
                  <p className="text-[#4A4A4A]/70 text-sm">Manage menu categories and organization</p>
                </div>
              </div>
            </div>
            <FoodButton
              onClick={() => setShowCreateForm(true)}
              className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </FoodButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A4A4A]/50 w-5 h-5" />
              <FoodInput
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <FoodBadge variant="outline" className="text-sm">
                {filteredCategories.length} categories
              </FoodBadge>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
              <span className="text-[#4A4A4A] text-lg">Loading categories...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div 
                    className="h-3 w-full"
                    style={{ backgroundColor: category.color || '#FF9933' }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{category.icon || '🍽️'}</span>
                        <div>
                          <h3 className="text-xl font-bold text-[#4A4A4A]">{category.name}</h3>
                          <p className="text-[#4A4A4A]/70 text-sm">Sort: {category.sortOrder || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FoodBadge 
                          variant={category.isActive ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </FoodBadge>
                      </div>
                    </div>
                    
                    <p className="text-[#4A4A4A]/80 text-sm mb-4 line-clamp-2">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <FoodButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="text-[#FF9933] border-[#FF9933] hover:bg-[#FF9933]/10"
                        >
                          <Edit className="w-4 h-4" />
                        </FoodButton>
                        <FoodButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(category)}
                          className={category.isActive ? "text-red-500 border-red-500 hover:bg-red-50" : "text-green-500 border-green-500 hover:bg-green-50"}
                        >
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </FoodButton>
                        <FoodButton
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(category._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </FoodButton>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCategories.length === 0 && !loading && (
              <div className="text-center py-12">
                <ChefHat className="w-20 h-20 text-[#FF9933] mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-[#4A4A4A] mb-2">
                  {searchQuery ? 'No categories found' : 'No categories yet'}
                </h3>
                <p className="text-[#4A4A4A]/70 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first category to organize your menu items'
                  }
                </p>
                {!searchQuery && (
                  <FoodButton
                    onClick={() => setShowCreateForm(true)}
                    className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Category
                  </FoodButton>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Category Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-[#FF9933]" />
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FoodLabel htmlFor="name">Category Name *</FoodLabel>
                <FoodInput
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Main Course, Appetizers"
                  className={formErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#FF9933]'}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <FoodLabel htmlFor="icon">Icon *</FoodLabel>
                <FoodInput
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  placeholder="🍽️"
                  className={formErrors.icon ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#FF9933]'}
                />
                {formErrors.icon && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.icon}
                  </p>
                )}
              </div>
            </div>

            <div>
              <FoodLabel htmlFor="description">Description *</FoodLabel>
              <FoodTextarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe this category..."
                rows={3}
                className={formErrors.description ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#FF9933]'}
              />
              {formErrors.description && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {formErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FoodLabel htmlFor="color">Color *</FoodLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <FoodInput
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="#FF9933"
                    className={formErrors.color ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#FF9933]'}
                  />
                </div>
                {formErrors.color && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.color}
                  </p>
                )}
              </div>

              <div>
                <FoodLabel htmlFor="sortOrder">Sort Order</FoodLabel>
                <FoodInput
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className={formErrors.sortOrder ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#FF9933]'}
                />
                {formErrors.sortOrder && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.sortOrder}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-[#FF9933] border-gray-300 rounded focus:ring-[#FF9933]"
                />
                <span className="text-sm text-[#4A4A4A]">Active category</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <FoodButton
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel
              </FoodButton>
              <FoodButton
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FF9933] hover:bg-[#CC7A29] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </>
                )}
              </FoodButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodCategoryManagementPage;
