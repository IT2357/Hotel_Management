import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Star, ShoppingCart, Heart, User, LogOut, AlertCircle, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';

// Get API base URL for images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : (window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin);

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredItems, setFilteredItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAvailable, setMenuAvailable] = useState(false);
  const [cartQuantities, setCartQuantities] = useState({});
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Load menu items from API
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        console.log('🔍 DEBUG: Loading menu items from API');
        const response = await api.get('/menu/items?limit=100');
        const items = response.data.data.items || [];

        console.log('🔍 DEBUG: Loaded menu items:', items.length);

        if (items.length > 0) {
          setMenuItems(items);
          setMenuAvailable(true);

          // Generate categories from items
          const categoryMap = {};
          items.forEach(item => {
            const catId = item.category;
            const catName = item.category?.name || 'Uncategorized';
            if (!categoryMap[catId]) {
              categoryMap[catId] = { name: catName, count: 0 };
            }
            categoryMap[catId].count++;
          });

          const categories = [
            { id: 'all', name: 'All Items', count: items.length },
            ...Object.entries(categoryMap).map(([id, data]) => ({
              id: id,
              name: data.name,
              count: data.count
            }))
          ];

          setMenuCategories(categories);
        } else {
          // Fall back to legacy items if API returns empty
          console.log('🔄 Falling back to legacy menu items');
          setMenuItems(legacyMenuItems);
          setMenuAvailable(true);

          // Generate categories from legacy items
          const categoryMap = {};
          legacyMenuItems.forEach(item => {
            const cat = item.category;
            if (!categoryMap[cat]) {
              categoryMap[cat] = { name: cat.charAt(0).toUpperCase() + cat.slice(1), count: 0 };
            }
            categoryMap[cat].count++;
          });

          const categories = [
            { id: 'all', name: 'All Items', count: legacyMenuItems.length },
            ...Object.entries(categoryMap).map(([id, data]) => ({
              id: id,
              name: data.name,
              count: data.count
            }))
          ];

          setMenuCategories(categories);
        }
      } catch (error) {
        console.error('Error loading menu items:', error);
        setMenuAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  const [menuCategories, setMenuCategories] = useState([
    { id: 'all', name: 'All Items', count: 0 }
  ]);

  // Legacy hardcoded items (will be removed once API is working)
  const legacyMenuItems = [
    // Appetizers & Starters
    {
      id: 1,
      name: 'Jaffna Mutton Rolls',
      description: 'Crispy fried rolls filled with spiced mutton and vegetables, a Jaffna specialty',
      price: 850,
      originalPrice: 850,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
      category: 'appetizers',
      rating: 4.8,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 2,
      name: 'Vegetable Cutlets',
      description: 'Golden fried vegetable patties with traditional Jaffna spices',
      price: 650,
      originalPrice: 650,
      image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400',
      category: 'appetizers',
      rating: 4.6,
      isVegetarian: true,
      isSpicy: false,
      isPopular: false
    },
    {
      id: 3,
      name: 'Fish Patties',
      description: 'Fresh fish mixed with potatoes and Jaffna spices, deep fried to perfection',
      price: 750,
      originalPrice: 750,
      image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
      category: 'appetizers',
      rating: 4.7,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 4,
      name: 'Jaffna Chicken 65',
      description: 'Spicy deep-fried chicken pieces marinated with Jaffna red chili paste',
      price: 950,
      originalPrice: 950,
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
      category: 'appetizers',
      rating: 4.9,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },

    // Soups & Salads
    {
      id: 5,
      name: 'Jaffna Crab Soup',
      description: 'Rich and creamy crab soup made with fresh Jaffna crabs and coconut milk',
      price: 1200,
      originalPrice: 1200,
      image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400',
      category: 'soups',
      rating: 4.8,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 6,
      name: 'Vegetable Rasam',
      description: 'Traditional South Indian soup with tamarind, tomatoes, and Jaffna spices',
      price: 450,
      originalPrice: 450,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      category: 'soups',
      rating: 4.5,
      isVegetarian: true,
      isSpicy: true,
      isPopular: false
    },

    // Rice & Biryanis
    {
      id: 7,
      name: 'Jaffna Chicken Biryani',
      description: 'Aromatic basmati rice cooked with chicken and traditional Jaffna spices',
      price: 1850,
      originalPrice: 1850,
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d8f1?w=400',
      category: 'rice',
      rating: 4.9,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 8,
      name: 'Seafood Biryani',
      description: 'Mixed seafood biryani with prawns, fish, and squid in Jaffna spice blend',
      price: 2250,
      originalPrice: 2250,
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      category: 'rice',
      rating: 4.8,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },

    // Curries & Gravies
    {
      id: 9,
      name: 'Jaffna Crab Curry',
      description: 'Signature Jaffna crab curry made with roasted spices and coconut milk',
      price: 2850,
      originalPrice: 2850,
      image: 'https://images.unsplash.com/photo-1626776877761-72e2a7c6d95c?w=400',
      category: 'curries',
      rating: 5.0,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 10,
      name: 'Mutton Curry (Jaffna Style)',
      description: 'Tender mutton cooked in traditional Jaffna curry paste with potatoes',
      price: 2250,
      originalPrice: 2250,
      image: 'https://images.unsplash.com/photo-1609167830220-7164aa3607c8?w=400',
      category: 'curries',
      rating: 4.8,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 11,
      name: 'Fish Curry with Brinjal',
      description: 'Fresh fish curry cooked with baby brinjals and Jaffna spices',
      price: 1950,
      originalPrice: 1950,
      image: 'https://images.unsplash.com/photo-1559847844-d2c6f8c6bd6c?w=400',
      category: 'curries',
      rating: 4.7,
      isVegetarian: false,
      isSpicy: true,
      isPopular: false
    },

    // Kottu & Street Food
    {
      id: 12,
      name: 'VALDORA Special Chicken Kottu',
      description: 'House special kottu roti with chicken, eggs, and vegetables',
      price: 1750,
      originalPrice: 1750,
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      category: 'kottu',
      rating: 4.9,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 13,
      name: 'Vegetable Kottu',
      description: 'Mixed vegetables chopped with roti and traditional spices',
      price: 1250,
      originalPrice: 1250,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
      category: 'kottu',
      rating: 4.6,
      isVegetarian: true,
      isSpicy: true,
      isPopular: false
    },

    // Seafood Specialties
    {
      id: 14,
      name: 'Seafood Dry Curry Bowl',
      description: 'Mixed seafood dry curry with roasted spices, served in traditional bowl',
      price: 2550,
      originalPrice: 2550,
      image: 'https://images.unsplash.com/photo-1559847844-d17f7e52c256?w=400',
      category: 'seafood',
      rating: 4.9,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },
    {
      id: 15,
      name: 'Jaffna Prawn Curry',
      description: 'King prawns cooked in coconut curry with Jaffna curry leaves',
      price: 2250,
      originalPrice: 2250,
      image: 'https://images.unsplash.com/photo-1559054663-e431ec5e6e2e?w=400',
      category: 'seafood',
      rating: 4.8,
      isVegetarian: false,
      isSpicy: true,
      isPopular: true
    },

    // Desserts & Sweets
    {
      id: 16,
      name: 'Jaffna Watalappam',
      description: 'Traditional coconut custard pudding with Jaffna spices and nuts',
      price: 850,
      originalPrice: 850,
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
      category: 'desserts',
      rating: 4.8,
      isVegetarian: true,
      isSpicy: false,
      isPopular: true
    },
    {
      id: 17,
      name: 'Pal Payasam',
      description: 'Rich milk pudding with rice and Jaffna cardamom flavor',
      price: 750,
      originalPrice: 750,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
      category: 'desserts',
      rating: 4.7,
      isVegetarian: true,
      isSpicy: false,
      isPopular: false
    }
  ];

  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const itemCategory = item.category;
        return itemCategory === selectedCategory;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredItems(filtered);
  }, [searchTerm, selectedCategory, menuItems]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle quantity changes
  const handleQuantityChange = (itemId, change) => {
    setCartQuantities(prev => {
      const current = prev[itemId] || 0;
      const newQuantity = Math.max(0, current + change);
      return { ...prev, [itemId]: newQuantity };
    });
  };

  // Add item to cart with quantity
  const handleAddToCart = (item, quantity = 1) => {
    if (quantity <= 0) return;

    for (let i = 0; i < quantity; i++) {
      addToCart(item);
    }
    // Reset quantity after adding to cart
    setCartQuantities(prev => ({ ...prev, [item._id || item.id]: 0 }));
  };

  // Handle different image formats: base64, URL, or relative path
  const getImageSrc = (item) => {
    if (item.imageUrl && item.imageUrl.startsWith('data:')) {
      return item.imageUrl; // Base64 image
    } else if (item.imageUrl && item.imageUrl.startsWith('http')) {
      return item.imageUrl; // Full URL
    } else if (item.image && item.image.startsWith('http')) {
      return item.image; // Full URL in image field
    } else if (item.imageUrl && item.imageUrl.startsWith('/api/')) {
      // Backend image URL - construct full URL (this is the main fix)
      return `${window.location.protocol}//${window.location.host}${item.imageUrl}`;
    } else if (item.image && item.image.startsWith('/api/')) {
      // Backend image URL in image field
      return `${window.location.protocol}//${window.location.host}${item.image}`;
    } else if (item.imageId) {
      // Direct imageId - construct the full path
      return `${window.location.protocol}//${window.location.host}/api/menu/image/${item.imageId}`;
    }
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400';
  };
  // Show loading state
  if (loading) {
    return (
      <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333', backgroundColor: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #C41E3A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p>Loading menu...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show message when menu is not available
  if (!menuAvailable) {
    return (
      <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333', backgroundColor: '#fff', minHeight: '100vh' }}>
        {/* Header */}
        <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#333' }}>
                <ArrowLeft size={20} />
                Back to Home
              </Link>
            </div>

            {/* VALDORA Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                V
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>VALDORA</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {user ? (
                <button onClick={handleLogout} style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              ) : (
                <Link to="/login" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} />
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Menu Not Available Message */}
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <AlertCircle size={64} color="#C41E3A" style={{ margin: '0 auto 2rem' }} />
            <h1 style={{ fontSize: '2.5rem', color: '#C41E3A', marginBottom: '1rem' }}>Menu Coming Soon</h1>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
              Our menu is currently being prepared. Please check back later or contact our staff for updates on our delicious offerings.
            </p>
            <Link
              to="/"
              style={{
                backgroundColor: '#C41E3A',
                color: 'white',
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.1rem'
              }}
            >
              <ArrowLeft size={20} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333', backgroundColor: '#fff' }}>
      {/* Header */}
      <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#333' }}>
              <ArrowLeft size={20} />
              Back to Home
            </Link>
          </div>

          {/* VALDORA Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              V
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>VALDORA</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/cart" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={16} />
              Cart
            </Link>
            {user ? (
              <button onClick={handleLogout} style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={16} />
                Sign Out
              </button>
            ) : (
              <Link to="/login" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #C41E3A 0%, #D2691E 100%)', color: 'white', padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontWeight: 'bold' }}>Our Authentic Jaffna Tamil Menu</h1>
        <p style={{ fontSize: '1.2rem', margin: '0 auto 2rem auto', maxWidth: '600px' }}>
          Discover the rich flavors of Jaffna Tamil cuisine, prepared with traditional recipes and fresh ingredients
        </p>

        {/* Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              paddingLeft: '3rem',
              outline: 'none'
            }}
          />
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
        </div>
      </section>

      {/* Categories Filter */}
      <section style={{ padding: '2rem', backgroundColor: '#f9f9f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            {menuCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: selectedCategory === category.id ? '2px solid #C41E3A' : '2px solid #ddd',
                  borderRadius: '25px',
                  backgroundColor: selectedCategory === category.id ? '#C41E3A' : 'white',
                  color: selectedCategory === category.id ? 'white' : '#333',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items Grid */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filteredItems.map((item) => (
            <div key={item._id || item.id} style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={getImageSrc(item)}
                  alt={item.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                {item.isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: '#FFD700',
                    color: '#C41E3A',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '15px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    Popular
                  </div>
                )}
                <button style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <Heart size={20} color="#C41E3A" />
                </button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <span style={{ marginLeft: '0.25rem', fontSize: '0.875rem', color: '#666' }}>
                    {item.rating || 4.5}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {item.isVeg && (
                      <span style={{
                        backgroundColor: '#22C55E',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        🥬 Veg
                      </span>
                    )}
                    {item.isSpicy && (
                      <span style={{
                        backgroundColor: '#EF4444',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        🌶️ Spicy
                      </span>
                    )}
                    {item.dietaryTags && item.dietaryTags.includes('vegan') && (
                      <span style={{
                        backgroundColor: '#16A34A',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        🌱 Vegan
                      </span>
                    )}
                    {item.dietaryTags && item.dietaryTags.includes('gluten-free') && (
                      <span style={{
                        backgroundColor: '#7C3AED',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        🌾 GF
                      </span>
                    )}
                    {item.dietaryTags && item.dietaryTags.includes('dairy-free') && (
                      <span style={{
                        backgroundColor: '#059669',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        🥛 DF
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                    {item.name}
                  </h3>
                  <span style={{
                    backgroundColor: '#E5E7EB',
                    color: '#374151',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '15px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {item.category?.name || 'Uncategorized'}
                  </span>
                </div>

                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {item.description || 'Delicious dish prepared with fresh ingredients'}
                </p>

                {/* Quantity Selector & Add to Cart */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleQuantityChange(item._id || item.id, -1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid #C41E3A',
                          backgroundColor: 'white',
                          color: '#C41E3A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
                        {cartQuantities[item._id || item.id] || 0}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item._id || item.id, 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid #C41E3A',
                          backgroundColor: 'white',
                          color: '#C41E3A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C41E3A' }}>
                      LKR {item.price}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item, cartQuantities[item._id || item.id] || 1)}
                    disabled={(cartQuantities[item._id || item.id] || 0) === 0}
                    style={{
                      backgroundColor: '#C41E3A',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '25px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: (cartQuantities[item._id || item.id] || 0) === 0 ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.3s ease',
                      opacity: (cartQuantities[item._id || item.id] || 0) === 0 ? 0.5 : 1
                    }}
                    onMouseOver={(e) => {
                      if ((cartQuantities[item._id || item.id] || 0) > 0) {
                        e.target.style.backgroundColor = '#A91E2A';
                      }
                    }}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#C41E3A'}
                  >
                    <ShoppingCart size={16} />
                    <span>Add {(cartQuantities[item._id || item.id] || 0) > 1 ? `(${cartQuantities[item._id || item.id]})` : ''}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No items found</p>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ background: '#C41E3A', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', background: '#FFD700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C41E3A', fontWeight: 'bold', fontSize: '1.2rem' }}>
              V
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>VALDORA</span>
          </div>
          <p>&copy; 2024 VALDORA Restaurant. All rights reserved. Authentic Jaffna Tamil Cuisine.</p>
        </div>
      </footer>
    </div>
  );
}
