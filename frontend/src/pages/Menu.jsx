import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      // Make sure this matches your actual backend endpoint
      const response = await axios.get('http://localhost:5000/api/menu');
      setMenuItems(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch menu data');
      console.error('Menu fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading menu...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="menu-container">
      <h1>Our Menu</h1>
      <div className="menu-grid">
        {menuItems.map((item) => (
          <div key={item._id || item.id} className="menu-item">
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <span className="price">${item.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
