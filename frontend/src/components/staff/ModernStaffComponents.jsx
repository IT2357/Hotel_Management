import React, { useState, useEffect } from 'react';

// ========================================
// MODERN ANIMATED STATS CARD
// ========================================
export const ModernStatsCard = ({ title, value, change, icon, gradient, maxValue = 100 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1500;
      const increment = value / (duration / 16);
      
      const counter = setInterval(() => {
        start += increment;
        if (start >= value) {
          setAnimatedValue(value);
          clearInterval(counter);
        } else {
          setAnimatedValue(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(counter);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

  const cardStyle = {
    background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '24px',
    padding: '28px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
    opacity: isVisible ? 1 : 0,
    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'pointer',
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const hoverStyle = {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)'
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{...cardStyle, ...(isHovered ? hoverStyle : {})}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top right, rgba(255, 255, 255, 0.2), transparent)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Icon */}
          <div style={{
            fontSize: '48px',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
            transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
            transition: 'transform 0.3s ease'
          }}>
            {icon}
          </div>
          
          {/* Progress Ring */}
          <div style={{ position: 'relative' }}>
            <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Circle */}
              <circle
                cx="35"
                cy="35"
                r="28"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Progress Circle */}
              <circle
                cx="35"
                cy="35"
                r="28"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                }}
              />
            </svg>
            {/* Percentage Text */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {Math.round(percentage)}%
            </div>
          </div>
        </div>
        
        {/* Value */}
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
          marginTop: '16px',
          marginBottom: '8px',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {animatedValue}
        </div>
        
        {/* Title */}
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.95)',
          marginBottom: '12px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
          {title}
        </div>
        
        {/* Change Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          fontSize: '14px',
          fontWeight: '600',
          color: 'white'
        }}>
          <span style={{ fontSize: '18px' }}>{change >= 0 ? '📈' : '📉'}</span>
          <span>{change >= 0 ? '+' : ''}{change}%</span>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>vs yesterday</span>
        </div>
      </div>
    </div>
  );
};

// ========================================
// MODERN NOTIFICATION BADGE
// ========================================
export const ModernNotificationBadge = ({ count = 0, onClick }) => {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '14px',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
      }}
    >
      <span style={{ fontSize: '24px' }}>🔔</span>
      
      {count > 0 && (
        <div style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          minWidth: '24px',
          height: '24px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white',
          padding: '0 6px',
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
          animation: isPulsing ? 'pulse 0.5s ease' : 'none'
        }}>
          {count > 99 ? '99+' : count}
        </div>
      )}
    </button>
  );
};

// ========================================
// MODERN QUICK ACTION CARD
// ========================================
export const ModernQuickActionCard = ({ title, description, icon, onClick, gradient }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '24px',
        background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0, 0, 0, 0.3)' 
          : '0 10px 20px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'left'
      }}
    >
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.2), transparent)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Icon */}
        <div style={{
          fontSize: '48px',
          transform: isHovered ? 'rotate(10deg) scale(1.1)' : 'rotate(0) scale(1)',
          transition: 'transform 0.3s ease',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
        }}>
          {icon}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '6px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            {description}
          </div>
        </div>
        
        {/* Arrow */}
        <div style={{
          fontSize: '24px',
          transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
          opacity: isHovered ? 1 : 0.6,
          transition: 'all 0.3s ease'
        }}>
          →
        </div>
      </div>
    </button>
  );
};

// ========================================
// MODERN LOADING SKELETON
// ========================================
export const ModernLoadingSkeleton = () => {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '180px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '24px'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Add keyframes for animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}
