// 📁 frontend/src/components/food/QualityCheckModal.jsx
// Quality Check Modal - Jaffna hospitality standards checklist
// Ensures food quality before marking as ready
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Circle,
  Thermometer,
  Eye,
  Ruler,
  Sparkles,
  AlertTriangle,
  ChefHat
} from 'lucide-react';
import FoodButton from './FoodButton';

const QualityCheckModal = ({ task, onComplete, onClose }) => {
  const [checks, setChecks] = useState({
    temperature: false,
    presentation: false,
    portionSize: false,
    garnish: false
  });

  const [allergyVerified, setAllergyVerified] = useState(false);
  const [dietaryVerified, setDietaryVerified] = useState(false);

  // Check if order has allergens or dietary tags
  const hasAllergens = task.orderId?.items?.some(item =>
    item.foodId?.allergens && item.foodId.allergens.length > 0
  );

  const hasDietaryTags = task.orderId?.items?.some(item =>
    item.foodId?.dietaryTags && item.foodId.dietaryTags.length > 0
  );

  // Toggle check
  const toggleCheck = (checkName) => {
    setChecks(prev => ({
      ...prev,
      [checkName]: !prev[checkName]
    }));
  };

  // Check if all required checks are complete
  const allChecksComplete = () => {
    const basicChecks = Object.values(checks).every(v => v === true);
    const allergyCheck = !hasAllergens || allergyVerified;
    const dietaryCheck = !hasDietaryTags || dietaryVerified;
    
    return basicChecks && allergyCheck && dietaryCheck;
  };

  // Handle submit
  const handleSubmit = () => {
    if (allChecksComplete()) {
      onComplete({
        ...checks,
        allergyChecked: allergyVerified,
        dietaryTagsVerified: dietaryVerified
      });
    }
  };

  // Quality check items configuration
  const qualityCheckItems = [
    {
      key: 'temperature',
      label: 'Temperature Check',
      description: 'Food is served at proper temperature',
      icon: Thermometer,
      color: 'text-red-500'
    },
    {
      key: 'presentation',
      label: 'Presentation',
      description: 'Plating and visual appeal meet standards',
      icon: Eye,
      color: 'text-purple-500'
    },
    {
      key: 'portionSize',
      label: 'Portion Size',
      description: 'Correct portion size as per menu',
      icon: Ruler,
      color: 'text-blue-500'
    },
    {
      key: 'garnish',
      label: 'Garnish & Finishing',
      description: 'Final touches and garnishes complete',
      icon: Sparkles,
      color: 'text-yellow-500'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Quality Check</h2>
                  <p className="text-sm opacity-90">
                    Order #{task.orderId?._id?.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Jaffna Standards Notice */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Jaffna Hospitality Standards
                  </h3>
                  <p className="text-sm text-orange-700">
                    Ensure all quality checks are complete before marking this order as ready.
                    Our guests expect excellence in every dish.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-2">
                {task.orderId?.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.name || item.foodId?.name}
                    </span>
                    
                    {/* Allergen badges */}
                    {item.foodId?.allergens && item.foodId.allergens.length > 0 && (
                      <div className="flex gap-1">
                        {item.foodId.allergens.slice(0, 2).map((allergen, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs"
                          >
                            {allergen}
                          </span>
                        ))}
                        {item.foodId.allergens.length > 2 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                            +{item.foodId.allergens.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Checks */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quality Checklist</h3>
              <div className="space-y-3">
                {qualityCheckItems.map((item) => {
                  const Icon = item.icon;
                  const isChecked = checks[item.key];

                  return (
                    <motion.button
                      key={item.key}
                      onClick={() => toggleCheck(item.key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full p-4 rounded-2xl border-2 transition-all text-left
                        ${isChecked
                          ? 'bg-green-50 border-green-300 shadow-lg shadow-green-100'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          ${isChecked ? 'bg-green-500' : 'bg-gray-100'}
                        `}>
                          <Icon className={`w-5 h-5 ${isChecked ? 'text-white' : item.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-semibold ${isChecked ? 'text-green-900' : 'text-gray-900'}`}>
                              {item.label}
                            </h4>
                            {isChecked ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <p className={`text-sm ${isChecked ? 'text-green-700' : 'text-gray-600'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Allergen Verification */}
            {hasAllergens && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Allergen Verification Required</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      This order contains items with allergens. Verify all ingredients are correct.
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={() => setAllergyVerified(!allergyVerified)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3
                    ${allergyVerified
                      ? 'bg-green-500 border-green-600 text-white'
                      : 'bg-white border-yellow-300 text-yellow-900 hover:bg-yellow-50'
                    }
                  `}
                >
                  {allergyVerified ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {allergyVerified ? 'Allergens Verified ✓' : 'Verify Allergen Information'}
                  </span>
                </motion.button>
              </div>
            )}

            {/* Dietary Tags Verification */}
            {hasDietaryTags && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Dietary Requirements</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      This order has special dietary tags (vegetarian, halal, etc.). Verify compliance.
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={() => setDietaryVerified(!dietaryVerified)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3
                    ${dietaryVerified
                      ? 'bg-green-500 border-green-600 text-white'
                      : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-50'
                    }
                  `}
                >
                  {dietaryVerified ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {dietaryVerified ? 'Dietary Tags Verified ✓' : 'Verify Dietary Compliance'}
                  </span>
                </motion.button>
              </div>
            )}

            {/* Special Instructions Reminder */}
            {task.orderId?.customerDetails?.specialInstructions && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Special Instructions</h4>
                <p className="text-sm text-purple-700 italic">
                  "{task.orderId.customerDetails.specialInstructions}"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-3xl">
            <div className="flex gap-3">
              <FoodButton
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </FoodButton>
              <FoodButton
                onClick={handleSubmit}
                disabled={!allChecksComplete()}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  ${allChecksComplete()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <CheckCircle className="w-5 h-5" />
                {allChecksComplete() ? 'Mark as Ready' : 'Complete All Checks'}
              </FoodButton>
            </div>

            {/* Progress Indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Progress</span>
                <span>
                  {Object.values(checks).filter(v => v).length + 
                   (hasAllergens && allergyVerified ? 1 : 0) + 
                   (hasDietaryTags && dietaryVerified ? 1 : 0)
                  } / {4 + (hasAllergens ? 1 : 0) + (hasDietaryTags ? 1 : 0)} Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ((Object.values(checks).filter(v => v).length + 
                        (hasAllergens && allergyVerified ? 1 : 0) + 
                        (hasDietaryTags && dietaryVerified ? 1 : 0)) / 
                       (4 + (hasAllergens ? 1 : 0) + (hasDietaryTags ? 1 : 0))) * 100
                    }%`
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QualityCheckModal;
