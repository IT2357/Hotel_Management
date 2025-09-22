import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Camera, X, ArrowLeft } from 'lucide-react';

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', count: 24 },
    { id: 'food', name: 'Food', count: 12 },
    { id: 'restaurant', name: 'Restaurant', count: 8 },
    { id: 'events', name: 'Events', count: 4 }
  ];

  const galleryImages = [
    {
      id: 1,
      src: 'https://culturecolombo.lk/wp-content/uploads/2020/09/culturecmb1.jpg',
      alt: 'VALDORA Restaurant Exterior',
      category: 'restaurant',
      title: 'Elegant Restaurant Exterior'
    },
    {
      id: 2,
      src: 'https://culturecolombo.lk/wp-content/uploads/2020/09/culturecmb2.jpg',
      alt: 'VALDORA Interior Design',
      category: 'restaurant',
      title: 'Authentic Jaffna Tamil Interior'
    },
    {
      id: 3,
      src: 'https://culturecolombo.lk/wp-content/uploads/2020/09/Curry-Bowl--scaled.jpg',
      alt: 'Jaffna Crab Curry',
      category: 'food',
      title: 'Traditional Jaffna Crab Curry'
    },
    {
      id: 4,
      src: 'https://culturecolombo.lk/wp-content/uploads/2020/09/Sea-Food-Bowl-in-sri-lankan-style-750x632.jpg',
      alt: 'Seafood Bowl',
      category: 'food',
      title: 'Fresh Seafood Bowl'
    },
    {
      id: 5,
      src: 'https://culturecolombo.lk/wp-content/uploads/2020/10/DSC04161-2-970x728.jpg',
      alt: 'Restaurant Interior Details',
      category: 'restaurant',
      title: 'Heritage Interior Design'
    },
    {
      id: 6,
      src: 'https://culturecolombo.lk/wp-content/uploads/2020/10/Tasting-Basket-970x728.jpg',
      alt: 'Food Tasting Basket',
      category: 'food',
      title: 'Culinary Tasting Experience'
    },
    {
      id: 7,
      src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      alt: 'Jaffna Tamil Dining Experience',
      category: 'restaurant',
      title: 'Authentic Dining Atmosphere'
    },
    {
      id: 8,
      src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      alt: 'Traditional Jaffna Dishes',
      category: 'food',
      title: 'Traditional Jaffna Cuisine'
    },
    {
      id: 9,
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      alt: 'Restaurant Ambiance',
      category: 'restaurant',
      title: 'Warm Restaurant Ambiance'
    },
    {
      id: 10,
      src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
      alt: 'Fresh Seafood Preparation',
      category: 'food',
      title: 'Fresh Seafood Preparation'
    },
    {
      id: 11,
      src: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
      alt: 'Special Event Celebration',
      category: 'events',
      title: 'Cultural Event Celebration'
    },
    {
      id: 12,
      src: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
      alt: 'Private Dining Event',
      category: 'events',
      title: 'Private Dining Experience'
    }
  ];

  const filteredImages = activeCategory === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeCategory);

  const openModal = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333' }}>
      {/* Header */}
      <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* VALDORA Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '50px', height: '50px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>
                V
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C41E3A' }}>VALDORA</span>
            </div>
          </div>
          <nav>
            <ul style={{ listStyle: 'none', display: 'flex', gap: '2rem', margin: 0, padding: 0 }}>
              <li><Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Home</Link></li>
              <li><Link to="/about" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>About</Link></li>
              <li><Link to="/menu" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Menu</Link></li>
              <li><Link to="/gallery" style={{ textDecoration: 'none', color: '#C41E3A', fontWeight: 500 }}>Gallery</Link></li>
              <li><Link to="/reservations" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Reservation</Link></li>
              <li><Link to="/blog" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Blog</Link></li>
              <li><Link to="/contact" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Contact</Link></li>
            </ul>
          </nav>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChefHat size={16} />
              Order Online
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ background: `url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200') center/cover`, height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '3rem', margin: 0, color: '#FFD700' }}>Our Gallery</h1>
          <p style={{ fontSize: '1.2rem', margin: '1rem 0 0 0' }}>Capturing the Essence of Jaffna Tamil Cuisine</p>
        </div>
      </section>

      {/* Gallery Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              style={{
                background: activeCategory === category.id ? '#C41E3A' : '#f5f5f5',
                color: activeCategory === category.id ? 'white' : '#333',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '25px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Camera size={16} />
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredImages.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onClick={() => openModal(image)}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              <img
                src={image.src}
                alt={image.alt}
                style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                padding: '2rem 1rem 1rem 1rem',
                color: 'white'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{image.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }} onClick={closeModal}>
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            background: 'white',
            borderRadius: '10px',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1001
              }}
            >
              <X size={20} />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
            />
            <div style={{ padding: '1rem', background: 'white' }}>
              <h3 style={{ margin: 0, color: '#C41E3A', fontSize: '1.2rem' }}>{selectedImage.title}</h3>
            </div>
          </div>
        </div>
      )}

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