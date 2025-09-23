import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Hotel, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckSquare, 
  Square,
  Sparkles,
  ChefHat,
  Clock,
  Users
} from 'lucide-react';
import api from '../../services/api';

const ValampuriMenuGenerator = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Valampuri categories with descriptions
  const valampuriCategories = [
    { 
      name: "Biriyanies", 
      id: 1, 
      description: "Aromatic basmati rice dishes with authentic Jaffna spices",
      itemCount: 5,
      icon: "🍚"
    },
    { 
      name: "Naans and Chapathis", 
      id: 2, 
      description: "Freshly baked breads and traditional flatbreads",
      itemCount: 6,
      icon: "🫓"
    },
    { 
      name: "Kottu", 
      id: 3, 
      description: "Sri Lankan street food favorite - chopped roti stir-fry",
      itemCount: 5,
      icon: "🥘"
    },
    { 
      name: "Dosa and Others", 
      id: 9, 
      description: "South Indian crepes and traditional breakfast items",
      itemCount: 6,
      icon: "🥞"
    },
    { 
      name: "Jaffna style curries", 
      id: 35, 
      description: "Authentic Jaffna Tamil curries with traditional spices",
      itemCount: 5,
      icon: "🍛"
    },
    { 
      name: "Rice & Curry", 
      id: 20, 
      description: "Traditional Sri Lankan rice and curry combinations",
      itemCount: 4,
      icon: "🍽️"
    }
  ];

  const restaurantInfo = {
    name: "Valampuri Hotel Restaurant",
    location: "148/10, Station Road, Jaffna, Sri Lanka",
    phone: "0772000206",
    email: "info@valampurihotel.com",
    website: "valampurihotel.com",
    description: "Authentic Jaffna cuisine with traditional Tamil flavors"
  };

  const handleCategorySelection = (categoryName) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(prev => prev.filter(cat => cat !== categoryName));
    } else {
      setSelectedCategories(prev => [...prev, categoryName]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(valampuriCategories.map(cat => cat.name));
    }
    setSelectAll(!selectAll);
  };

  const generateValampuriMenu = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category to generate');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/menu-selection/generate-valampuri-menu', {
        selectedCategories,
        culturalContext: 'jaffna'
      });

      toast.success(`Successfully generated ${response.data.data.menu.totalItems} authentic Valampuri menu items!`);
      
      // Navigate to the enhanced review page
      navigate(`/admin/menu-review/${response.data.data.menu._id}`, {
        state: { 
          isValampuriGenerated: true,
          restaurant: response.data.data.restaurant,
          categories: response.data.data.categories
        }
      });
      
    } catch (error) {
      console.error('Error generating Valampuri menu:', error);
      toast.error(error.response?.data?.message || 'Failed to generate Valampuri menu');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = selectedCategories.reduce((total, catName) => {
    const category = valampuriCategories.find(cat => cat.name === catName);
    return total + (category?.itemCount || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
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
                  <Hotel className="w-8 h-8 text-purple-400" />
                  <span>Valampuri Menu Generator</span>
                </h1>
                <p className="text-gray-300 mt-1">
                  Generate authentic Jaffna cuisine menu from Valampuri Hotel database
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-400">Selected Items</p>
              <p className="text-2xl font-bold text-purple-400">{totalItems}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Restaurant Info Card */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Hotel className="w-10 h-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{restaurantInfo.name}</h2>
              <p className="text-gray-300 mb-4">{restaurantInfo.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>{restaurantInfo.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Phone className="w-4 h-4 text-purple-400" />
                  <span>{restaurantInfo.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>{restaurantInfo.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>{restaurantInfo.website}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Select Menu Categories</h3>
            
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/30 transition-colors"
            >
              {selectAll ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {valampuriCategories.map((category) => {
            const isSelected = selectedCategories.includes(category.name);
            
            return (
              <div
                key={category.id}
                onClick={() => handleCategorySelection(category.name)}
                className={`
                  relative cursor-pointer rounded-xl p-6 border transition-all duration-300 transform hover:scale-105
                  ${isSelected 
                    ? 'bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-500/20' 
                    : 'bg-black/40 border-gray-600/30 hover:border-purple-500/30'
                  }
                `}
              >
                {/* Selection Indicator */}
                <div className="absolute top-4 right-4">
                  {isSelected ? (
                    <CheckSquare className="w-6 h-6 text-purple-400" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Category Content */}
                <div className="mb-4">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{category.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{category.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-purple-300">
                      <ChefHat className="w-4 h-4" />
                      <span>{category.itemCount} items</span>
                    </div>
                  </div>
                </div>

                {/* Selection Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-purple-500/10 rounded-xl border-2 border-purple-500/50 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generateValampuriMenu}
            disabled={loading || selectedCategories.length === 0}
            className={`
              flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300
              ${selectedCategories.length > 0 && !loading
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transform hover:scale-105'
                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Menu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generate Valampuri Menu ({totalItems} items)</span>
              </>
            )}
          </button>
        </div>

        {/* Info Footer */}
        {selectedCategories.length > 0 && (
          <div className="mt-8 bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Authentic Jaffna recipes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Traditional cooking methods</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI-enhanced with cultural context</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValampuriMenuGenerator;
