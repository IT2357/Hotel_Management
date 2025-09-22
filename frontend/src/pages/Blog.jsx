import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, ChefHat, Clock, Users } from 'lucide-react';

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "An Insight to Our Jaffna Tamil Interior Designing: A Heritage Experience Awaits You",
      excerpt: "Discover how VALDORA brings authentic Jaffna Tamil interior design to life, creating spaces that tell stories of our rich cultural heritage.",
      image: "https://culturecolombo.lk/wp-content/uploads/2020/10/DSC04161-2-970x728.jpg",
      author: "VALDORA Team",
      date: "2024-01-15",
      readTime: "5 min read",
      category: "Interior Design"
    },
    {
      id: 2,
      title: "VALDORA's Most Popular Jaffna Tamil Dishes",
      excerpt: "Explore the culinary masterpieces that have made VALDORA a favorite destination for authentic Jaffna Tamil cuisine.",
      image: "https://culturecolombo.lk/wp-content/uploads/2020/10/Tasting-Basket-970x728.jpg",
      author: "Chef Kumar",
      date: "2024-01-10",
      readTime: "7 min read",
      category: "Cuisine"
    },
    {
      id: 3,
      title: "The Art of Jaffna Tamil Spice Blending",
      excerpt: "Learn about the traditional spice blending techniques that give Jaffna Tamil cuisine its distinctive and unforgettable flavor.",
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800",
      author: "Chef Lakshmi",
      date: "2024-01-05",
      readTime: "6 min read",
      category: "Culinary Arts"
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
              <li><Link to="/blog" style={{ textDecoration: 'none', color: '#C41E3A', fontWeight: 500 }}>Blog</Link></li>
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
      <section style={{ background: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200') center/cover`, height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '3rem', margin: 0, color: '#FFD700' }}>Our Blog</h1>
          <p style={{ fontSize: '1.2rem', margin: '1rem 0 0 0' }}>Stories from the Heart of Jaffna Tamil Cuisine</p>
        </div>
      </section>

      {/* Blog Posts */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          {blogPosts.map((post) => (
            <article key={post.id} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.3s ease' }}>
              <img src={post.image} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ background: '#C41E3A', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem' }}>{post.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    <Calendar size={14} />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0', color: '#C41E3A' }}>{post.title}</h2>
                <p style={{ color: '#666', margin: '0 0 1.5rem 0', lineHeight: '1.6' }}>{post.excerpt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    <User size={14} />
                    {post.author}
                    <Clock size={14} />
                    {post.readTime}
                  </div>
                  <Link to={`/blog/${post.id}`} style={{ background: '#C41E3A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', textDecoration: 'none', fontSize: '0.9rem' }}>
                    Read More
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section style={{ background: '#f9f9f9', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#C41E3A', fontFamily: "'Merriweather', serif", marginBottom: '1rem' }}>Stay Updated</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Subscribe to our newsletter to receive the latest updates on Jaffna Tamil cuisine and VALDORA's culinary adventures.</p>
          <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem' }}
            />
            <button style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer' }}>
              Subscribe
            </button>
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