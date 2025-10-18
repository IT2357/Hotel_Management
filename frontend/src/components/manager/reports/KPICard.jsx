import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const VARIANTS = {
  light: {
    container: 'bg-white border border-gray-200 shadow',
    title: 'text-gray-600',
    value: 'text-gray-900',
    unit: 'text-gray-500',
    footer: 'text-gray-500',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600',
    trendFlat: 'text-gray-600',
    iconContainer: 'rounded-full bg-blue-50 p-3',
    iconWrapper: 'text-blue-500',
    iconWarning: 'text-red-500',
    progressTrack: 'bg-gray-200',
    progressFillOnTrack: 'bg-blue-500',
    progressFillMet: 'bg-green-500',
    progressLabel: 'text-gray-500',
  },
  manager: {
    container: 'bg-[#0e1f42] border border-[#162a52] shadow-[0_18px_40px_rgba(8,14,29,0.55)] backdrop-blur-sm',
    title: 'text-[#8ba3d0]',
    value: 'text-[#f5f7ff]',
    unit: 'text-[#bcd1ff]',
    footer: 'text-[#8ba3d0]',
    trendUp: 'text-[#34d399]',
    trendDown: 'text-[#f87171]',
    trendFlat: 'text-[#8ba3d0]',
  iconContainer: 'rounded-xl bg-[#10234f] p-3 transition-transform duration-300 group-hover:scale-110',
    iconWrapper: 'text-[#facc15]',
    iconWarning: 'text-[#f87171]',
    progressTrack: 'bg-[#132a58]',
    progressFillOnTrack: 'bg-[#2563eb]',
    progressFillMet: 'bg-[#22c55e]',
    progressLabel: 'text-[#8ba3d0]',
  },
};

const KPICard = ({ 
  title, 
  value, 
  unit = '', 
  trend, 
  target, 
  icon: Icon,
  iconColor,
  className = '',
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'light'
}) => {
  const theme = VARIANTS[variant] ?? VARIANTS.light;
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
      return <TrendingUp className={`w-4 h-4 ${theme.trendUp}`} />;
    } else if (trend.direction === 'down') {
      return <TrendingDown className={`w-4 h-4 ${theme.trendDown}`} />;
    }
    return <Minus className={`w-4 h-4 ${theme.trendFlat}`} />;
  };

  const getTrendColor = () => {
    if (!trend) return theme.trendFlat;
    
    return trend.direction === 'up' ? theme.trendUp : 
           trend.direction === 'down' ? theme.trendDown : theme.trendFlat;
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

  const containerHover = variant === 'manager'
    ? 'group cursor-pointer transition-all duration-300 hover:shadow-[0_25px_50px_rgba(10,20,48,0.65)]'
    : '';

  return (
    <div className={`rounded-lg ${theme.container} ${containerHover} ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className={`${theme.title} font-medium ${titleSizes[size]}`}>{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className={`font-bold ${theme.value} ${valueSizes[size]}`}>
              {formatValue(value)}
            </p>
            {unit && <span className={`${theme.unit} text-sm`}>{unit}</span>}
          </div>
        </div>
        
        {Icon && (
          <div
            className={`${theme.iconContainer} ${
              isUnderTarget ? theme.iconWarning : theme.iconWrapper
            }`}
            style={!isUnderTarget && iconColor ? { color: iconColor } : undefined}
          >
            <Icon
              className={
                size === 'large' ? 'w-8 h-8' : size === 'small' ? 'w-5 h-5' : 'w-6 h-6'
              }
            />
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
          <div className={`flex items-center gap-1 text-sm ${theme.footer}`}>
            <span>Target: {formatValue(target)}{unit}</span>
            {isUnderTarget && <AlertTriangle className={`w-4 h-4 ${theme.iconWarning}`} />}
          </div>
        )}
      </div>

      {target && (
        <div className="mt-3">
          <div className={`flex justify-between text-xs ${theme.progressLabel} mb-1`}>
            <span>Progress</span>
            <span>{((value / target) * 100).toFixed(0)}%</span>
          </div>
          <div className={`w-full ${theme.progressTrack} rounded-full h-2`}>
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                value >= target ? theme.progressFillMet : theme.progressFillOnTrack
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