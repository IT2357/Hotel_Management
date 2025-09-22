import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Location',
      details: ['204 Arasadi Rd, Jaffna 40000', 'Northern University, Kantharmadam'],
      color: 'text-red-500'
    },
    {
      icon: Phone,
      title: 'Phone',
      details: ['(+94) 77 442 2448', '(+94) 11 123 4567'],
      color: 'text-green-500'
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['reservations@valdora.lk', 'info@valdora.lk'],
      color: 'text-blue-500'
    },
    {
      icon: Clock,
      title: 'Opening Hours',
      details: ['Mon-Thu: 12PM - 3:30PM & 6:30PM - 10:30PM', 'Fri-Sun: 12PM - 3:30PM & 6:30PM - 10:30PM'],
      color: 'text-purple-500'
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
              <li><Link to="/about" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>About</Link></li>
              <li><Link to="/menu" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Menu</Link></li>
              <li><Link to="/gallery" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Gallery</Link></li>
              <li><Link to="/reservations" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Reservation</Link></li>
              <li><Link to="/blog" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Blog</Link></li>
              <li><Link to="/contact" style={{ textDecoration: 'none', color: '#C41E3A', fontWeight: 500 }}>Contact</Link></li>
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
      <section style={{ background: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200') center/cover`, height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '3rem', margin: 0, color: '#FFD700' }}>Contact Us</h1>
          <p style={{ fontSize: '1.2rem', margin: '1rem 0 0 0' }}>Get in Touch with VALDORA</p>
        </div>
      </section>

      {/* Contact Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>

          {/* Contact Information */}
          <div>
            <h2 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif", fontSize: '2rem', marginBottom: '2rem' }}>Get In Touch</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              We'd love to hear from you! Whether you have questions about our menu, want to make a reservation,
              or just want to share your experience with VALDORA, we're here to help.
            </p>

            <div style={{ display: 'grid', gap: '2rem' }}>
              {contactInfo.map((info, index) => (
                <div key={index} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.icon className={info.color} size={24} />
                  </div>
                  <div>
                    <h3 style={{ color: '#C41E3A', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{info.title}</h3>
                    {info.details.map((detail, idx) => (
                      <p key={idx} style={{ margin: '0.25rem 0', color: '#666' }}>{detail}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif", fontSize: '2rem', marginBottom: '2rem' }}>Send us a Message</h2>

            {isSubmitted ? (
              <div style={{ background: '#d4edda', color: '#155724', padding: '2rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #c3e6cb' }}>
                <CheckCircle size={48} style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ margin: '0 0 1rem 0' }}>Thank You!</h3>
                <p>Your message has been sent successfully. We'll get back to you soon!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '2rem', borderRadius: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem', resize: 'vertical' }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#C41E3A',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#a0172e'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#C41E3A'}
                >
                  <Send size={18} />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section style={{ padding: '4rem 2rem', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: '#C41E3A', fontFamily: "'Merriweather', serif", fontSize: '2rem', marginBottom: '2rem' }}>Find Us</h2>
          <div style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3958.745!2d80.0144!3d9.6828!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afe53fd1c1c1c1f%3A0x1234567890abcdef!2s204%20Arasadi%20Rd%2C%20Jaffna%2040000%2C%20Sri%20Lanka!5e0!3m2!1sen!2s!4v1695380000000!5m2!1sen!2s"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="VALDORA Location - 204 Arasadi Rd, Jaffna"
            ></iframe>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ color: '#666', fontSize: '1.1rem', fontWeight: 'bold' }}>204 Arasadi Rd, Jaffna 40000, Sri Lanka</p>
            <p style={{ color: '#999', fontSize: '1rem' }}>Northern University, Kantharmadam Area</p>
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