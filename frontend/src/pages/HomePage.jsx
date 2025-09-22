import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Building2, ShoppingCart, Menu, X, Home, Info, Utensils, Image, Calendar, BookOpen, Phone, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const slides = [
    'https://culturecolombo.lk/wp-content/uploads/2020/09/culturecmb1.jpg',
    'https://culturecolombo.lk/wp-content/uploads/2020/09/culturecmb2.jpg',
    'https://culturecolombo.lk/wp-content/uploads/2020/09/Curry-Bowl--scaled.jpg'
  ];

  const testimonials = [
    {
      text: "VALDORA brings authentic Jaffna Tamil cuisine to life with traditional flavors that remind me of home. The spices are perfectly balanced and the service is exceptional.",
      name: "Kumar",
      title: "Authentic Jaffna Flavors"
    },
    {
      text: "Best place for traditional Jaffna food in Colombo. They capture the essence of Tamil cooking with fresh ingredients and traditional methods. Highly recommended!",
      name: "Priya",
      title: "Traditional Excellence"
    },
    {
      text: "The Jaffna crab curry and mutton dishes are outstanding. VALDORA has mastered the art of Tamil cuisine while maintaining the authentic taste we love.",
      name: "Ravi",
      title: "Masterful Tamil Cuisine"
    },
    {
      text: "As someone who grew up in Jaffna, I can say VALDORA truly captures the authentic flavors of our homeland. Every dish tells a story of Tamil culinary heritage.",
      name: "Lakshmi",
      title: "Heritage Preserved"
    }
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    const testimonialTimer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(testimonialTimer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333' }}>
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="text-xl font-bold text-red-600 group-hover:text-red-700 transition-colors">VALDORA</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 group">
                <Home size={18} className="group-hover:scale-110 transition-transform" />
                Home
              </Link>
              <Link to="/about" className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 group">
                <Info size={18} className="group-hover:scale-110 transition-transform" />
                About
              </Link>
              <Link to="/menu" className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 group">
                <Utensils size={18} className="group-hover:scale-110 transition-transform" />
                Menu
              </Link>
              <Link to="/gallery" className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 group">
                <Image size={18} className="group-hover:scale-110 transition-transform" />
                Gallery
              </Link>
              <Link to="/reservations" className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 group">
                <Calendar size={18} className="group-hover:scale-110 transition-transform" />
                Reservation
              </Link>
              <Link to="/blog" className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 group">
                <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
                Blog
              </Link>
              <Link to="/contact" className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 group">
                <Phone size={18} className="group-hover:scale-110 transition-transform" />
                Contact
              </Link>
              {user && (
                <Link to="/dashboard/my-orders" className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors duration-200 group">
                  <ClipboardList size={18} className="group-hover:scale-110 transition-transform" />
                  My Orders
                </Link>
              )}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/menu" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg">
                <ShoppingCart size={18} />
                Order Online
              </Link>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <User size={18} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
              <div className="px-4 py-4 space-y-3">
                <Link
                  to="/"
                  className="flex items-center gap-3 text-gray-700 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home size={18} />
                  Home
                </Link>
                <Link
                  to="/about"
                  className="flex items-center gap-3 text-gray-700 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Info size={18} />
                  About
                </Link>
                <Link
                  to="/menu"
                  className="flex items-center gap-3 text-gray-700 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Utensils size={18} />
                  Menu
                </Link>
                <Link
                  to="/gallery"
                  className="flex items-center gap-3 text-gray-700 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Image size={18} />
                  Gallery
                </Link>
                <Link
                  to="/reservations"
                  className="flex items-center gap-3 text-gray-700 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Calendar size={18} />
                  Reservation
                </Link>
                <Link
                  to="/blog"
                  className="flex items-center gap-3 text-gray-700 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <BookOpen size={18} />
                  Blog
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center gap-3 text-gray-700 hover:text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Phone size={18} />
                  Contact
                </Link>
                {user && (
                  <Link
                    to="/dashboard/my-orders"
                    className="flex items-center gap-3 text-red-600 hover:text-red-700 font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ClipboardList size={18} />
                    My Orders
                  </Link>
                )}

                {/* Mobile Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link
                    to="/menu"
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ShoppingCart size={18} />
                    Order Online
                  </Link>
                  {user ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md block text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User size={18} />
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ background: `url(${slides[currentSlide]}) center/cover`, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '2rem', margin: '0 0 1rem 0', color: '#FFD700' }}>Authentic Jaffna Tamil Cuisine</h3>
          <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '4rem', margin: 0, color: '#FFD700' }}>VALDORA</h1>
          <p style={{ fontSize: '1.5rem', margin: '1rem 0 2rem 0' }}>Bringing the authentic Jaffna Tamil culinary experience to the Heart of Colombo.🌴</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/rooms" style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={16} />
              Explore Rooms
            </Link>
            <Link to="/menu" style={{ background: '#D2691E', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={16} />
              Order Food
            </Link>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      {user && (
        <section style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', background: '#f9f9f9' }}>
          <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif", marginBottom: '2rem' }}>Welcome back, {user.name || user.email}!</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif", marginBottom: '1rem' }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Link to="/" style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  🏠
                  Home
                </Link>
                <Link to="/menu" style={{ background: '#D2691E', color: 'white', padding: '0.75rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <ShoppingCart size={14} />
                  Order Food
                </Link>
                <Link to="/dashboard/my-orders" style={{ background: '#228B22', color: 'white', padding: '0.75rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  📋
                  My Orders
                </Link>
                <Link to="/gallery" style={{ background: '#4169E1', color: 'white', padding: '0.75rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  📸
                  Gallery
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" style={{ background: '#6B7280', color: 'white', padding: '0.75rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', gridColumn: 'span 2' }}>
                    ⚙️
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif", marginBottom: '1rem' }}>Account Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
                {user.emailVerified && <p><strong>✓ Email Verified</strong></p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif" }}>Two simple reasons. One simple Answer.</h3>
            <h2 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif" }}>Why VALDORA ?</h2>
            <p>Designed to be the Culinary epicenter, We try to uphold the traditions of the Jaffna Tamil Household while bringing out the authentic flavours of Jaffna with a bounty of fresh seasonal ingredients. We take extra care to deliver fresh farm produce to a local classy table cuisine with an emphasis on seasonal & locally sourced ingredients and with the freshest Seafood and traditional spices.</p>
            <a href="#" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>Learn more</a>
          </div>
          <div>
            <img src="https://culturecolombo.lk/wp-content/uploads/2020/09/Sea-Food-Bowl-in-sri-lankan-style-750x632.jpg" alt="Jaffna Seafood Bowl" style={{ width: '100%', maxWidth: '500px' }} />
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', background: '#f9f9f9' }}>
        <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif" }}>discover our AUTHENTIC JAFFNA TAMIL MENU</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>Jaffna Crab Curry (Traditional Recipe)</span>
            <span>2850</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>VALDORA Special Mutton Curry</span>
            <span>2250</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>Jaffna Fish Curry with Brinjal</span>
            <span>1950</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>Traditional Jaffna Kothu Roti</span>
            <span>1250</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>Seafood Dry Curry Bowl</span>
            <span>2550</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>Jaffna String Hopper Biriyani</span>
            <span>1950</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>Traditional Jaffna Prawn Curry</span>
            <span>2250</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <span>VALDORA Special Chicken Kottu</span>
            <span>1750</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none' }}>Check Full Menu</Link>
        </div>
      </section>

      {/* Favorites Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', background: '#f9f9f9' }}>
        <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif", marginBottom: '3rem' }}>Customer Favorites</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.3s ease' }}>
            <img src="https://culturecolombo.lk/wp-content/uploads/2020/09/Curry-Bowl--scaled.jpg" alt="Jaffna Crab Curry" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#C41E3A', marginBottom: '0.5rem' }}>Jaffna Crab Curry (Traditional Recipe)</h3>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Our signature dish featuring fresh crab cooked in authentic Jaffna spices</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C41E3A' }}>LKR 2,850</span>
                <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', fontSize: '0.9rem' }}>Order Now</Link>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.3s ease' }}>
            <img src="https://culturecolombo.lk/wp-content/uploads/2020/09/Sea-Food-Bowl-in-sri-lankan-style-750x632.jpg" alt="Seafood Bowl" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#C41E3A', marginBottom: '0.5rem' }}>VALDORA Special Mutton Curry</h3>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Tender mutton slow-cooked with traditional Jaffna spices and coconut milk</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C41E3A' }}>LKR 2,250</span>
                <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', fontSize: '0.9rem' }}>Order Now</Link>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.3s ease' }}>
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400" alt="Fresh Seafood" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#C41E3A', marginBottom: '0.5rem' }}>Seafood Dry Curry Bowl</h3>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Assortment of fresh seafood cooked dry with aromatic Jaffna spices</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#C41E3A' }}>LKR 2,550</span>
                <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', fontSize: '0.9rem' }}>Order Now</Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/menu" style={{ background: '#D2691E', color: 'white', padding: '0.75rem 2rem', border: 'none', borderRadius: '5px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>View All Favorites</Link>
        </div>
      </section>

      {/* Flavours Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', background: '#333', color: 'white' }}>
        <h2 style={{ textAlign: 'center', color: '#FFD700', fontFamily: "'Merriweather', serif" }}>we offer AUTHENTIC JAFFNA FLAVOURS</h2>
        <p style={{ textAlign: 'center' }}>We want you to sit down and enjoy your meal just like the way you enjoy your homemade Jaffna Tamil dishes! We have embarked on this journey to preserve and celebrate Jaffna Tamil culinary heritage and we are glad that you have taken the time to experience our authentic flavors.</p>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif" }}>Testimonials</h2>
        <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto' }}>
          {testimonials.map((testimonial, index) => (
            <div key={index} style={{ minWidth: '300px', padding: '1rem', background: 'white', color: '#333', borderRadius: '5px', display: index === testimonialIndex ? 'block' : 'none' }}>
              <p>"{testimonial.text}"</p>
              <cite>- {testimonial.name}, {testimonial.title}</cite>
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif" }}>Learn Authentic Jaffna Tamil Cuisine From The Blog</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <img src="https://culturecolombo.lk/wp-content/uploads/2020/10/DSC04161-2-970x728.jpg" alt="Jaffna Interior Design" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <h3>An insight to our Jaffna Tamil interior designing: A Heritage Experience awaits you.</h3>
            <a href="#" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none' }}>Read More</a>
          </div>
          <div>
            <img src="https://culturecolombo.lk/wp-content/uploads/2020/10/Tasting-Basket-970x728.jpg" alt="Jaffna Popular Dishes" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <h3>VALDORA's most popular Jaffna Tamil dishes</h3>
            <a href="#" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none' }}>Read More</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#C41E3A', color: 'white', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#FFD700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#C41E3A', fontWeight: 'bold', fontSize: '1.2rem' }}>
                V
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>VALDORA</span>
            </div>
            <p>204 Arasadi Rd, Jaffna 40000</p>
            <p>Northern University, Kantharmadam</p>
            <p>Email: reservations@valdora.lk</p>
            <p>Phone: (+94) 77 442 2448</p>
          </div>
          <div>
            <h4>QUICK LINKS</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link></li>
              <li><Link to="/about" style={{ color: 'white', textDecoration: 'none' }}>About</Link></li>
              <li><Link to="/menu" style={{ color: 'white', textDecoration: 'none' }}>Menu</Link></li>
              <li><Link to="/gallery" style={{ color: 'white', textDecoration: 'none' }}>Gallery</Link></li>
              <li><Link to="/reservations" style={{ color: 'white', textDecoration: 'none' }}>Reservation</Link></li>
              <li><Link to="/blog" style={{ color: 'white', textDecoration: 'none' }}>Blog</Link></li>
              <li><Link to="/contact" style={{ color: 'white', textDecoration: 'none' }}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>OPENING HOURS</h4>
            <p>MONDAY – THURSDAY<br />12.00 – 3.30 PM & 6.30 -10.30 PM</p>
            <p>FRIDAY – SUNDAY<br />12.00 – 3.30 PM & 6.30 -10.30 PM</p>
            <p>(Hours might differ)</p>
          </div>
          <div>
            <h4>SIGN UP</h4>
            <p>Subscribe to our newsletter to receive upcoming promotions and events at VALDORA</p>
            <input type="email" placeholder="Enter Your Email Address" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }} />
            <button style={{ background: '#FFD700', color: '#C41E3A', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Submit</button>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <a href="https://www.facebook.com/valdorajaffna/" style={{ color: 'white' }}>FB</a>
              <a href="https://www.instagram.com/valdorajaffna/" style={{ color: 'white' }}>IG</a>
              <a href="https://www.tripadvisor.com/valdorajaffna" style={{ color: 'white' }}>TA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
