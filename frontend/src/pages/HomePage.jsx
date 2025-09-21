import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Building2, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
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
              <li><a href="#home" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Home</a></li>
              <li><a href="#about" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>About</a></li>
              <li><a href="#menu" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Menu</a></li>
              <li><a href="#gallery" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Gallery</a></li>
              <li><a href="#reservation" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Reservation</a></li>
              <li><a href="#blog" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Blog</a></li>
              <li><a href="#contact" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Contact</a></li>
            </ul>
          </nav>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={16} />
              Order Online
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
            <p>No 25 Kensington Garden, Colombo 00400</p>
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

      <style jsx>{`
        @media (max-width: 768px) {
          header .header-container {
            flex-direction: column;
            gap: 1rem;
          }
          nav ul {
            flex-wrap: wrap;
            justify-content: center;
          }
          .why-content {
            flex-direction: column;
          }
          .hero h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
