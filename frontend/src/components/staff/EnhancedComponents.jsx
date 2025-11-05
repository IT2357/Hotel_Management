import React, { useState, useEffect } from 'react';
import '../../styles/StaffDashboardEnhanced.css';

// ========================================
// ENHANCED STATISTICS CARD
// ========================================
export const EnhancedStatsCard = ({ title, value, change, icon, gradient, maxValue = 100 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="stats-card-enhanced animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="stats-icon-wrapper mb-4">
            <span className="text-2xl">{icon}</span>
          </div>
          
          <h3 className="stats-value">
            {animatedValue}
          </h3>
          
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            {title}
          </p>
          
          <div className="stats-change">
            <span className={`change-indicator ${change >= 0 ? 'positive' : 'negative'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500">from yesterday</span>
          </div>
        </div>
        
        {/* Animated Progress Ring */}
        <div className="progress-ring">
          <svg width="60" height="60">
            <defs>
              <linearGradient id={`progressGradient-${title}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
            <circle
              cx="30"
              cy="30"
              r="28"
              stroke="#e2e8f0"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="30"
              cy="30"
              r="28"
              stroke={`url(#progressGradient-${title})`}
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s ease',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%'
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ========================================
// ENHANCED TASK CARD
// ========================================
export const EnhancedTaskCard = ({ task, onStatusUpdate, index = 0 }) => {
  const [selectedStatus, setSelectedStatus] = useState(task.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityGradient = (priority) => {
    const gradients = {
      urgent: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      high: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      medium: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      low: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    };
    return gradients[priority] || gradients.medium;
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === task.status || isUpdating) return;
    
    setIsUpdating(true);
    setSelectedStatus(newStatus);
    
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(task._id, newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setSelectedStatus(task.status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="task-card-3d hover-lift"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Task Header with Gradient */}
      <div className="task-header" style={{ background: getPriorityGradient(task.priority) }}>
        <div className="task-badge-group">
          <span className="task-priority-badge">{task.priority?.toUpperCase()}</span>
          <span className="task-category-badge">{task.category}</span>
        </div>
        <div className="task-actions">
          <button className="text-white opacity-75 hover:opacity-100 transition-opacity">
            ⋯
          </button>
        </div>
      </div>
      
      {/* Task Content */}
      <div className="task-content">
        <h4 className="task-title">{task.title}</h4>
        <p className="task-description">{task.description}</p>
        
        {/* Task Meta Information */}
        <div className="task-meta-grid">
          <div className="meta-item">
            <span className="meta-icon">📍</span>
            <span>{task.location}</span>
          </div>
          {task.roomNumber && (
            <div className="meta-item">
              <span className="meta-icon">🏠</span>
              <span>Room {task.roomNumber}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <span>{task.estimatedDuration || 30}m</span>
          </div>
        </div>
        
        {/* Interactive Status Selector */}
        <div className="status-selector">
          {['pending', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              className={`status-option ${selectedStatus === status ? 'active' : ''}`}
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating}
            >
              <div className="status-dot"></div>
              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
      
      {/* Task Footer */}
      <div className="task-footer">
        <div className="assigned-staff">
          <div className="staff-avatar">
            {task.assignedTo?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {task.assignedTo?.name || 'Unassigned'}
          </span>
        </div>
        {selectedStatus === 'completed' && (
          <div className="completion-badge">
            ✅ Completed
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// LOADING SKELETON
// ========================================
export const LoadingSkeleton = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="skeleton-loading h-8 w-3/4"></div>
        <div className="skeleton-loading h-4 w-full"></div>
        <div className="skeleton-loading h-4 w-5/6"></div>
        <div className="flex gap-2">
          <div className="skeleton-loading h-10 w-24"></div>
          <div className="skeleton-loading h-10 w-24"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center py-12">
      <div className="spinner-modern"></div>
    </div>
  );
};

// ========================================
// ENHANCED BUTTON
// ========================================
export const EnhancedButton = ({ children, onClick, variant = 'primary', disabled = false, icon }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-magnetic btn-primary-enhanced ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {children}
      </span>
    </button>
  );
};

// ========================================
// ANIMATED CHART BAR
// ========================================
export const AnimatedChartBar = ({ label, value, maxValue = 100, color = '#667eea' }) => {
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedHeight(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-12 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <div
          className="absolute bottom-0 w-full rounded-lg transition-all duration-1000 ease-out"
          style={{
            height: `${animatedHeight}%`,
            background: `linear-gradient(to top, ${color}, ${color}dd)`
          }}
        >
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white">
            {value}
          </div>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
};

// ========================================
// PERFORMANCE METER
// ========================================
export const PerformanceMeter = ({ department, score, icon }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{department}</span>
        </div>
        <span className="text-2xl font-bold gradient-text">{animatedScore}%</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${animatedScore}%`,
            background: getScoreColor(score)
          }}
        ></div>
      </div>
    </div>
  );
};

// ========================================
// NOTIFICATION BADGE
// ========================================
export const NotificationBadge = ({ count, onClick }) => {
  if (count === 0) return null;
  
  return (
    <button
      onClick={onClick}
      className="relative p-3 glass-card hover-lift rounded-xl"
    >
      <span className="text-xl">🔔</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};

// ========================================
// QUICK ACTION CARD
// ========================================
export const QuickActionCard = ({ title, description, icon, gradient, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-6 rounded-2xl border-2 border-transparent glass-card hover-lift transition-all duration-500"
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl blur opacity-30 animate-pulse"
            style={{ background: gradient }}
          ></div>
          <div
            className="relative p-4 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500"
            style={{ background: gradient }}
          >
            <span className="text-3xl filter drop-shadow-sm">{icon}</span>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {description}
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-2">
          <span className="text-2xl animate-bounce">→</span>
        </div>
      </div>
    </button>
  );
};

export default {
  EnhancedStatsCard,
  EnhancedTaskCard,
  LoadingSkeleton,
  EnhancedButton,
  AnimatedChartBar,
  PerformanceMeter,
  NotificationBadge,
  QuickActionCard
};
