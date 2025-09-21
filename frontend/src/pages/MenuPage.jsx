import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Star, ShoppingCart, Heart, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredItems, setFilteredItems] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuCategories = [
    { id: 'all', name: 'All Items', count: 32 },
    { id: 'appetizers', name: 'Appetizers & Starters', count: 8 },
    { id: 'soups', name: 'Soups & Salads', count: 4 },
    { id: 'rice', name: 'Rice & Biryanis', count: 6 },
    { id: 'curries', name: 'Curries & Gravies', count: 8 },
    { id: 'kottu', name: 'Kottu & Street Food', count: 4 },
    { id: 'seafood', name: 'Seafood Specialties', count: 6 },
    { id: 'desserts', name: 'Desserts & Sweets', count: 4 },
    { id: 'beverages', name: 'Beverages', count: 3 }
  ];

  const menuItems = [
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
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [searchTerm, selectedCategory]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <p style={{ fontSize: '1.2rem', margin: '0 0 2rem 0', maxWidth: '600px', margin: '0 auto' }}>
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
            <div key={item.id} style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={item.image}
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
                    {item.rating}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    {item.isVegetarian && (
                      <span style={{
                        backgroundColor: '#22C55E',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        Veg
                      </span>
                    )}
                    {item.isSpicy && (
                      <span style={{
                        backgroundColor: '#EF4444',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        Spicy
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                  {item.name}
                </h3>

                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>
                      LKR {item.price}
                    </span>
                    {item.originalPrice !== item.price && (
                      <span style={{
                        textDecoration: 'line-through',
                        color: '#999',
                        marginLeft: '0.5rem',
                        fontSize: '1rem'
                      }}>
                        LKR {item.originalPrice}
                      </span>
                    )}
                  </div>
                  <Link
                    to="/cart"
                    style={{
                      backgroundColor: '#C41E3A',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '25px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </Link>
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
