import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Gift, 
  Calendar, 
  Tag,
  Users,
  Percent,
  IndianRupee
} from 'lucide-react';
import FoodButton from '../../../components/food/FoodButton';
import FoodInput from '../../../components/food/FoodInput';
import FoodSelect from '../../../components/food/FoodSelect';
import FoodTextarea from '../../../components/food/FoodTextarea';
import offerService from '../services/offerService';

const AdminOffers = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'percentage',
    discountValue: '',
    target: {
      minOrders: 1,
      itemType: '',
      category: ''
    },
    jaffnaItems: [],
    startDate: '',
    endDate: '',
    maxRedemptions: '',
    isActive: true
  });

  const queryClient = useQueryClient();

  const { data: offers, isLoading, error, refetch } = useQuery({
    queryKey: ['adminOffers'],
    queryFn: () => offerService.getAllOffers()
  });

  const createMutation = useMutation({
    mutationFn: (data) => offerService.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOffers']);
      setShowForm(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => offerService.updateOffer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOffers']);
      setShowForm(false);
      setEditingOffer(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => offerService.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOffers']);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'percentage',
      discountValue: '',
      target: {
        minOrders: 1,
        itemType: '',
        category: ''
      },
      jaffnaItems: [],
      startDate: '',
      endDate: '',
      maxRedemptions: '',
      isActive: true
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTargetChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      target: {
        ...prev.target,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      discountValue: Number(formData.discountValue),
      target: {
        ...formData.target,
        minOrders: Number(formData.target.minOrders)
      },
      maxRedemptions: formData.maxRedemptions ? Number(formData.maxRedemptions) : null
    };

    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      type: offer.type,
      discountValue: offer.discountValue,
      target: {
        minOrders: offer.target?.minOrders || 1,
        itemType: offer.target?.itemType || '',
        category: offer.target?.category || ''
      },
      jaffnaItems: offer.jaffnaItems || [],
      startDate: offer.startDate.split('T')[0],
      endDate: offer.endDate.split('T')[0],
      maxRedemptions: offer.maxRedemptions || '',
      isActive: offer.isActive
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading offers: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Offers</h2>
        <FoodButton
          onClick={() => {
            setShowForm(!showForm);
            setEditingOffer(null);
            resetForm();
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add New Offer'}
        </FoodButton>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingOffer ? 'Edit Offer' : 'Create New Offer'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FoodInput
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
              
              <FoodSelect
                label="Offer Type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                options={[
                  { value: 'percentage', label: 'Percentage Discount' },
                  { value: 'fixed_amount', label: 'Fixed Amount Discount' },
                  { value: 'free_item', label: 'Free Item' }
                ]}
                required
              />
            </div>
            
            <FoodTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FoodInput
                label={formData.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                type="number"
                value={formData.discountValue}
                onChange={(e) => handleInputChange('discountValue', e.target.value)}
                min={1}
                max={formData.type === 'percentage' ? 100 : undefined}
                required
                icon={formData.type === 'percentage' ? Percent : IndianRupee}
              />
              
              <FoodInput
                label="Minimum Orders Required"
                type="number"
                value={formData.target.minOrders}
                onChange={(e) => handleTargetChange('minOrders', e.target.value)}
                min={1}
                icon={Users}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FoodInput
                label="Item Type (Optional)"
                value={formData.target.itemType}
                onChange={(e) => handleTargetChange('itemType', e.target.value)}
                placeholder="e.g., seafood, curry"
              />
              
              <FoodInput
                label="Category (Optional)"
                value={formData.target.category}
                onChange={(e) => handleTargetChange('category', e.target.value)}
                placeholder="e.g., Main Course"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FoodInput
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                icon={Calendar}
              />
              
              <FoodInput
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
                icon={Calendar}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FoodInput
                label="Max Redemptions (Optional)"
                type="number"
                value={formData.maxRedemptions}
                onChange={(e) => handleInputChange('maxRedemptions', e.target.value)}
                min={1}
              />
              
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-gray-700">
                  Offer Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <FoodButton
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingOffer(null);
                  resetForm();
                }}
              >
                Cancel
              </FoodButton>
              <FoodButton
                type="submit"
                loading={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingOffer ? 'Update Offer' : 'Create Offer'}
              </FoodButton>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers?.data?.map((offer) => (
                <tr key={offer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Gift className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{offer.title}</div>
                        <div className="text-sm text-gray-500">{offer.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {offer.type === 'percentage' && `${offer.discountValue}% OFF`}
                      {offer.type === 'fixed_amount' && `LKR ${offer.discountValue} OFF`}
                      {offer.type === 'free_item' && 'Free Item'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {offer.target?.minOrders ? `${offer.target.minOrders}+ orders` : 'No target'}
                    </div>
                    {offer.target?.itemType && (
                      <div className="text-sm text-gray-500">{offer.target.itemType}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(offer.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {new Date(offer.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      offer.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(offer)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(offer._id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                        disabled={deleteMutation.isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {offers?.data?.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No offers yet</h3>
            <p className="text-gray-500">Create your first offer to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOffers;