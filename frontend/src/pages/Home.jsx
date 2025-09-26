import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      // Use the same API endpoint as Menu component
      const response = await axios.get('http://localhost:5000/api/menu');
      setMenuItems(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch menu data');
      console.error('Home menu fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;
