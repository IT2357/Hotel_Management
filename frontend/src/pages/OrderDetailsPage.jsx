import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Clock, CheckCircle, Package, ChefHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OrderDetailsPage() {
  const [activeTab, setActiveTab] = useState('current');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sample order data
  const currentOrders = [
    {
      id: 'VAL20240921001',
      date: '2024-09-21T14:30:00Z',
      status: 'preparing',
      type: 'dine-in',
      tableNumber: '15',
      items: [
        { name: 'Jaffna Crab Curry', quantity: 2, price: 2850 },
        { name: 'VALDORA Special Mutton Curry', quantity: 1, price: 2250 }
      ],
      total: 7950,
      estimatedTime: '25 minutes'
    }
  ];

  const orderHistory = [
    {
      id: 'VAL20240920001',
      date: '2024-09-20T18:45:00Z',
      status: 'completed',
      type: 'delivery',
      address: '123 Main Street, Colombo 00400',
      items: [
        { name: 'Jaffna Watalappam', quantity: 3, price: 850 },
        { name: 'Seafood Dry Curry Bowl', quantity: 1, price: 2550 }
      ],
      total: 5100,
      deliveryTime: '35 minutes'
    },
    {
      id: 'VAL20240919001',
      date: '2024-09-19T13:15:00Z',
      status: 'completed',
      type: 'dine-in',
      tableNumber: '8',
      items: [
        { name: 'Traditional Jaffna Kothu Roti', quantity: 2, price: 1250 },
        { name: 'Fish Curry with Brinjal', quantity: 1, price: 1950 }
      ],
      total: 4450,
      estimatedTime: '30 minutes'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return '#F59E0B';
      case 'ready': return '#10B981';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderCard = (order) => (
    <div key={order.id} style={{
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
            Order #{order.id}
          </h3>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            {formatDate(order.date)}
          </p>
        </div>
        <div style={{
          backgroundColor: getStatusColor(order.status),
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>
          {getStatusText(order.status)}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {order.type === 'dine-in' ? (
            <>
              <Package size={16} color="#666" />
              <span style={{ color: '#666', fontSize: '0.875rem' }}>
                Table {order.tableNumber}
              </span>
            </>
          ) : (
            <>
              <MapPin size={16} color="#666" />
              <span style={{ color: '#666', fontSize: '0.875rem' }}>
                {order.address}
              </span>
            </>
          )}
        </div>

        {order.estimatedTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Clock size={16} color="#666" />
            <span style={{ color: '#666', fontSize: '0.875rem' }}>
              {order.type === 'dine-in' ? 'Estimated ready time' : 'Delivery time'}: {order.estimatedTime}
            </span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
          Order Items:
        </h4>
        {order.items.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontWeight: '500' }}>{item.name}</span>
              <span style={{ color: '#666', marginLeft: '0.5rem' }}>x{item.quantity}</span>
            </div>
            <span>LKR {item.price * item.quantity}</span>
          </div>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '1rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
          <span>Total:</span>
          <span style={{ color: '#C41E3A' }}>LKR {order.total}</span>
        </div>
      </div>

      {order.status === 'preparing' && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#F59E0B', fontSize: '0.875rem' }}>
            <ChefHat size={16} />
            <span>Your authentic Jaffna Tamil cuisine is being prepared with love!</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Rubik', sans-serif", margin: 0, padding: 0, lineHeight: '1.6', color: '#333' }}>
      {/* Header */}
      <header style={{ background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/dashboard/my-orders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#333' }}>
              <ArrowLeft size={20} />
              Back to Orders
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
                <User size={16} />
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

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '1rem' }}>
            Order Details
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            Track your VALDORA orders and view order history
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
          <div style={{ backgroundColor: '#f9f9f9', borderRadius: '25px', padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('current')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '20px',
                backgroundColor: activeTab === 'current' ? '#C41E3A' : 'transparent',
                color: activeTab === 'current' ? 'white' : '#666',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Current Orders
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '20px',
                backgroundColor: activeTab === 'history' ? '#C41E3A' : 'transparent',
                color: activeTab === 'history' ? 'white' : '#666',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Order History
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div>
          {activeTab === 'current' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#333' }}>
                Current Orders ({currentOrders.length})
              </h2>
              {currentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <Package size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ color: '#666', marginBottom: '1rem' }}>No current orders</h3>
                  <p style={{ color: '#999', marginBottom: '2rem' }}>Your active orders will appear here</p>
                  <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold' }}>
                    Order Now
                  </Link>
                </div>
              ) : (
                currentOrders.map(renderOrderCard)
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#333' }}>
                Order History ({orderHistory.length})
              </h2>
              {orderHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <Clock size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ color: '#666', marginBottom: '1rem' }}>No order history</h3>
                  <p style={{ color: '#999', marginBottom: '2rem' }}>Your past orders will appear here</p>
                  <Link to="/menu" style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold' }}>
                    Order Now
                  </Link>
                </div>
              ) : (
                orderHistory.map(renderOrderCard)
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/menu" style={{ background: '#6B7280', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Order More Food
            </Link>
            <Link to="/dashboard/my-orders" style={{ background: '#C41E3A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              View All Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#C41E3A', color: 'white', padding: '2rem', textAlign: 'center', marginTop: '4rem' }}>
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
