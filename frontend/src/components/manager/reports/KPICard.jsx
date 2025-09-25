import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const KPICard = ({ 
  title, 
  value, 
  unit = '', 
  trend, 
  target, 
  icon: Icon,
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.direction === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend.direction === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    
    return trend.direction === 'up' ? 'text-green-600' : 
           trend.direction === 'down' ? 'text-red-600' : 'text-gray-600';
  };

  const isUnderTarget = target && value < target;

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const titleSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const valueSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  return (
    <div className={`bg-white rounded-lg shadow border ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className={`text-gray-600 font-medium ${titleSizes[size]}`}>{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className={`font-bold text-gray-900 ${valueSizes[size]}`}>
              {formatValue(value)}
            </p>
            {unit && <span className="text-gray-500 text-sm">{unit}</span>}
          </div>
        </div>
        
        {Icon && (
          <div className={`${isUnderTarget ? 'text-red-500' : 'text-blue-500'}`}>
            <Icon className={size === 'large' ? 'w-8 h-8' : size === 'small' ? 'w-5 h-5' : 'w-6 h-6'} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {trend && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trend.percentage ? `${trend.percentage.toFixed(1)}%` : trend.description}
            </span>
          </div>
        )}

        {target && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Target: {formatValue(target)}{unit}</span>
            {isUnderTarget && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        )}
      </div>

      {target && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{((value / target) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                value >= target ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KPICard;