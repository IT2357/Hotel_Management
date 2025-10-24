import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Calendar, DollarSign, Target, Gift } from 'lucide-react';
import FoodButton from '../food/FoodButton';
import FoodBadge from '../food/FoodBadge';

const OfferForm = ({ offer = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
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

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (offer) {
      setFormData({
        ...offer,
        startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
        endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
        maxRedemptions: offer.maxRedemptions || '',
        target: offer.target || { minOrders: 1, itemType: '', category: '' }
      });
    }
  }, [offer]);

  const generateCode = () => {
    const randomCode = 'OFFER' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, code: randomCode }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTargetChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      target: { ...prev.target, [field]: value }
    }));
  };

  const toggleJaffnaItem = (item) => {
    setFormData(prev => ({
      ...prev,
      jaffnaItems: prev.jaffnaItems.includes(item)
        ? prev.jaffnaItems.filter(i => i !== item)
        : [...prev.jaffnaItems, item]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.discountValue || formData.discountValue <= 0) newErrors.discountValue = 'Discount value must be greater than 0';
    if (formData.type === 'percentage' && formData.discountValue > 100) newErrors.discountValue = 'Percentage cannot exceed 100%';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Clean target object - remove empty strings
      const cleanTarget = {
        minOrders: parseInt(formData.target.minOrders) || 1
      };
      
      // Only add non-empty strings
      if (formData.target.itemType && formData.target.itemType.trim()) {
        cleanTarget.itemType = formData.target.itemType.trim();
      }
      if (formData.target.category && formData.target.category.trim()) {
        cleanTarget.category = formData.target.category.trim();
      }

      const submitData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : null,
        // Convert datetime-local strings to ISO date strings
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        target: cleanTarget
      };
      onSubmit(submitData);
    }
  };

  const jaffnaItemOptions = [
    'kottu', 'curry', 'seafood', 'mutton', 'chicken',
    'vegetable', 'dessert', 'beverage', 'appetizer'
  ];

  const quickDurations = [
    { label: '1 Day', days: 1 },
    { label: '1 Week', days: 7 },
    { label: '1 Month', days: 30 },
  ];

  const setQuickDuration = (days) => {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    
    setFormData(prev => ({
      ...prev,
      startDate: start.toISOString().slice(0, 16),
      endDate: end.toISOString().slice(0, 16)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-600" />
          Basic Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Weekend Special 20% Off"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your offer..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
                placeholder="e.g., WEEKEND20"
              />
              <FoodButton type="button" onClick={generateCode} variant="outline">
                Generate
              </FoodButton>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Discount Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'percentage', label: 'Percentage', icon: '%' },
                { value: 'fixed_amount', label: 'Fixed Amount', icon: 'LKR' },
                { value: 'free_item', label: 'Free Item', icon: '🎁' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('type', type.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value * {formData.type === 'percentage' && '(%)'}
              {formData.type === 'fixed_amount' && '(LKR)'}
            </label>
            <input
              type="number"
              value={formData.discountValue}
              onChange={(e) => handleChange('discountValue', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 ${
                errors.discountValue ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={formData.type === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
              min="0"
              max={formData.type === 'percentage' ? '100' : undefined}
            />
            {errors.discountValue && <p className="text-red-500 text-xs mt-1">{errors.discountValue}</p>}
          </div>
        </div>
      </div>

      {/* Target Criteria */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Target Criteria
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Orders Required
            </label>
            <input
              type="number"
              value={formData.target.minOrders}
              onChange={(e) => handleTargetChange('minOrders', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jaffna Special Items
            </label>
            <div className="flex flex-wrap gap-2">
              {jaffnaItemOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleJaffnaItem(item)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    formData.jaffnaItems.includes(item)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validity Period */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Validity Period
        </h3>

        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            {quickDurations.map((duration) => (
              <FoodButton
                key={duration.label}
                type="button"
                onClick={() => setQuickDuration(duration.days)}
                variant="outline"
                size="sm"
              >
                {duration.label}
              </FoodButton>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Redemptions (Optional)
            </label>
            <input
              type="number"
              value={formData.maxRedemptions}
              onChange={(e) => handleChange('maxRedemptions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
              placeholder="Leave empty for unlimited"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-700">Offer Status</label>
          <p className="text-xs text-gray-500">Enable or disable this offer</p>
        </div>
        <button
          type="button"
          onClick={() => handleChange('isActive', !formData.isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            formData.isActive ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <FoodButton
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </FoodButton>
        <FoodButton
          type="submit"
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
        >
          {offer ? 'Update Offer' : 'Create Offer'}
        </FoodButton>
      </div>
    </form>
  );
};

export default OfferForm;

