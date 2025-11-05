import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [language, setLanguage] = useState('en'); // 'en' for English, 'ta' for Tamil
  const navigate = useNavigate();

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('foodCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('foodCart', JSON.stringify(cart));
  }, [cart]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const res = await api.get('/food/menu');
        setMenuItems(res.data.data);
        setFilteredItems(res.data.data);
      } catch (err) {
        setError('Failed to load menu items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Filter menu items based on search term and category
  useEffect(() => {
    let result = menuItems;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.en.toLowerCase().includes(term) || 
        item.name.ta.includes(term) ||
        item.description.en.toLowerCase().includes(term) ||
        item.description.ta.includes(term) ||
        item.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    setFilteredItems(result);
  }, [searchTerm, selectedCategory, menuItems]);

  // Get unique categories
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  // Add item to cart
  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId));
  };

  // Update item quantity in cart
  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Get cart item count
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Navigate to cart
  const goToCart = () => {
    navigate('/food/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#4A4A4A]">Menu</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded ${language === 'en' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('ta')}
                className={`px-3 py-1 rounded ${language === 'ta' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
              >
                தமிழ்
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-48 w-full"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#4A4A4A]">
            {language === 'en' ? 'Our Menu' : 'எங்கள் மெனு'}
          </h1>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-[#4A4A4A]">
                {language === 'en' ? 'Language:' : 'மொழி:'}
              </span>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm ${language === 'en' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('ta')}
                className={`px-3 py-1 rounded text-sm ${language === 'ta' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
              >
                தமிழ்
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'en' ? "Search menu..." : "மெனு தேடு..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
              />
              <svg 
                className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-[#FF9933] text-white'
                    : 'bg-white text-[#4A4A4A] border border-gray-300'
                }`}
              >
                {category === 'all' 
                  ? (language === 'en' ? 'All' : 'அனைத்தும்') 
                  : category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-[#4A4A4A]">
              {language === 'en' ? 'No menu items found' : 'மெனு பொருட்கள் எதுவும் கிடைக்கவில்லை'}
            </h3>
            <p className="mt-1 text-gray-500">
              {language === 'en' 
                ? 'Try adjusting your search or filter to find what you\'re looking for.' 
                : 'நீங்கள் தேடுவதைக் கண்டறிய உங்கள் தேடல் அல்லது வடிப்பானைச் சரிசெய்ய முயற்சிக்கவும்.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item._id} 
                className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-[#FF9933] hover:shadow-lg transition-shadow duration-300"
              >
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={language === 'en' ? item.name.en : item.name.ta} 
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-[#4A4A4A] mb-2">
                    {language === 'en' ? item.name.en : item.name.ta}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {language === 'en' ? item.description.en : item.description.ta}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags && item.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 bg-[#FFF5E6] text-[#FF9933] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-[#FF9933]">
                        LKR {item.price.toFixed(2)}
                      </p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-sm text-gray-500 line-through">
                          LKR {item.originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-[#FF9933] hover:bg-[#E68A2E] text-white px-4 py-2 rounded-lg transition-colors duration-300"
                    >
                      {language === 'en' ? 'Add to Cart' : 'வண்டியில் சேர்'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Cart Button */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={goToCart}
              className="bg-[#FF9933] text-white rounded-full p-4 shadow-lg hover:bg-[#E68A2E] transition-colors duration-300 flex items-center"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" 
                />
              </svg>
              <span className="ml-2 font-bold">{cartItemCount}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;