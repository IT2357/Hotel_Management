import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CultureColomboMenuPageFixed = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cart, addToCart, cartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuData();
  }, []);

  useEffect(() => {
    filterMenuItems();
  }, [selectedCategory, menuItems]);

  const fetchMenuData = async () => {
    try {
      console.log('🔄 Fetching menu data...');
      const response = await axios.get('http://localhost:5000/api/menu/items');
      
      if (response.data.success) {
        const items = response.data.data || [];
        console.log('✅ Loaded items:', items.length);
        
        setMenuItems(items);
        
        // Extract categories
        const cats = [...new Set(items.map(item => item.category?.name || 'Other'))];
        setCategories(cats);
        
        setLoading(false);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const filterMenuItems = () => {
    let filtered = menuItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category?.name === selectedCategory);
    }
    
    setFilteredItems(filtered);
  };

  const handleAddToCart = (item) => {
    const portion = {
      name: 'Regular',
      price: item.basePrice || item.displayPrice || 0
    };
    addToCart(item, portion, 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-white mt-4">Loading Culture Colombo Menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-2">Menu Loading Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchMenuData}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-yellow-400">🌴 CULTURE COLOMBO</h1>
              <p className="text-gray-400 text-sm">Authentic Sri Lankan Cuisine</p>
            </div>
            
            <button
              onClick={() => navigate('/checkout')}
              className="relative bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500 transition duration-300 flex items-center"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-black via-gray-900 to-black py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-white">MOUTH WATERING</span>
            <br />
            <span className="text-yellow-400">MENU</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Authentic Sri Lankan culinary experience with {menuItems.length} dishes across {categories.length} categories
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Categories</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full transition duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All ({menuItems.length})
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition duration-300 ${
                  selectedCategory === category
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category} ({menuItems.filter(item => item.category?.name === category).length})
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item._id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-yellow-400 transition duration-300">
              <div className="relative">
                <img
                  src={item.primaryImage?.url || item.images?.[0]?.url || 'https://via.placeholder.com/400x200?text=Culture+Colombo'}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x200?text=Culture+Colombo';
                  }}
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.type === 'Veg' || item.foodType === 'veg' ? 'bg-green-600 text-white' :
                    item.type === 'Seafood' ? 'bg-blue-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {item.type || (item.foodType === 'veg' ? 'Veg' : 'Non-Veg')}
                  </span>
                  {item.spiceLevel === 'Hot' && (
                    <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs">
                      🌶️ Spicy
                    </span>
                  )}
                  {item.isHalal && (
                    <span className="bg-green-700 text-white px-2 py-1 rounded-full text-xs">
                      ☪️ Halal
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h4 className="text-white font-bold text-lg mb-2">{item.name}</h4>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-yellow-400 font-bold text-xl">
                    LKR {item.basePrice || item.displayPrice || 0}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {item.category?.name}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full bg-yellow-400 text-black py-2 rounded-lg hover:bg-yellow-500 transition duration-300 font-semibold flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No items found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CultureColomboMenuPageFixed;
