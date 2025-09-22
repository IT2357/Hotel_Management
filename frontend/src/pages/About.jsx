import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Award, Users, Heart, Clock, MapPin, Phone, Mail } from 'lucide-react';

export default function About() {
  const teamMembers = [
    {
      name: "Chef Kumar",
      role: "Executive Chef",
      image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
      description: "Master of Jaffna Tamil cuisine with 15+ years of experience"
    },
    {
      name: "Priya Fernando",
      role: "Restaurant Manager",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
      description: "Ensuring exceptional dining experiences for our guests"
    },
    {
      name: "Ravi Kumar",
      role: "Culinary Director",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      description: "Preserving authentic Jaffna Tamil culinary traditions"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Authenticity",
      description: "We stay true to traditional Jaffna Tamil recipes and cooking methods passed down through generations."
    },
    {
      icon: Award,
      title: "Quality",
      description: "Only the freshest, locally-sourced ingredients make it to our kitchen and your table."
    },
    {
      icon: Users,
      title: "Community",
      description: "Building connections between Jaffna Tamil culture and food lovers from around the world."
    },
    {
      icon: ChefHat,
      title: "Innovation",
      description: "Honoring tradition while creating modern culinary experiences that delight our guests."
    }
  ];

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
              <li><Link to="/about" style={{ textDecoration: 'none', color: '#C41E3A', fontWeight: 500 }}>About</Link></li>
              <li><Link to="/menu" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Menu</Link></li>
              <li><Link to="/gallery" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Gallery</Link></li>
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
      <section style={{ background: `url('https://culturecolombo.lk/wp-content/uploads/2020/09/culturecmb1.jpg') center/cover`, height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', padding: '0 2rem' }}>
          <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '4rem', margin: 0, color: '#FFD700' }}>About VALDORA</h1>
          <p style={{ fontSize: '1.3rem', margin: '1rem 0 0 0' }}>Bringing Authentic Jaffna Tamil Cuisine to Colombo</p>
        </div>
      </section>

      {/* Our Story Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif", fontSize: '2.5rem', marginBottom: '1.5rem' }}>Our Story</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              VALDORA was born from a deep passion for preserving and celebrating Jaffna Tamil culinary heritage.
              Our founders, descendants of Jaffna Tamil families, recognized the need to keep authentic traditional
              recipes and cooking methods alive in the modern world.
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              What started as a small family kitchen has grown into Colombo's premier destination for authentic
              Jaffna Tamil cuisine. We take pride in using traditional cooking methods, locally-sourced ingredients,
              and recipes passed down through generations.
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
              Every dish we serve tells a story of Jaffna Tamil culture, tradition, and the unwavering commitment
              to culinary excellence that defines our heritage.
            </p>
          </div>
          <div>
            <img
              src="https://culturecolombo.lk/wp-content/uploads/2020/09/Sea-Food-Bowl-in-sri-lankan-style-750x632.jpg"
              alt="Traditional Jaffna Tamil Seafood"
              style={{ width: '100%', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
            />
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section style={{ background: '#f9f9f9', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif", fontSize: '2.5rem', marginBottom: '3rem' }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {values.map((value, index) => (
              <div key={index} style={{ background: 'white', padding: '2rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '60px', height: '60px', background: 'linear-gradient(45deg, #C41E3A, #FFD700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <value.icon size={30} color="white" />
                </div>
                <h3 style={{ color: '#C41E3A', fontSize: '1.3rem', marginBottom: '1rem' }}>{value.title}</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif", fontSize: '2.5rem', marginBottom: '3rem' }}>Meet Our Team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {teamMembers.map((member, index) => (
            <div key={index} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <img src={member.image} alt={member.name} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ color: '#C41E3A', fontSize: '1.3rem', marginBottom: '0.5rem' }}>{member.name}</h3>
                <p style={{ color: '#FFD700', fontWeight: 'bold', marginBottom: '1rem' }}>{member.role}</p>
                <p style={{ color: '#666', lineHeight: '1.6' }}>{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ background: 'linear-gradient(45deg, #C41E3A, #8B0000)', color: 'white', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>15+</div>
              <div style={{ fontSize: '1.1rem' }}>Years of Culinary Excellence</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>50+</div>
              <div style={{ fontSize: '1.1rem' }}>Traditional Recipes</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>10K+</div>
              <div style={{ fontSize: '1.1rem' }}>Happy Customers</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>24/7</div>
              <div style={{ fontSize: '1.1rem' }}>Authentic Experience</div>
            </div>
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