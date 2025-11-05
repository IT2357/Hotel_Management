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
    // Fresh modern card design with vibrant colors
    container: 'relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl border-0',
    title: 'text-gray-700',
    value: 'text-gray-900',
    unit: 'text-gray-600',
    footer: 'text-gray-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-rose-600',
    trendFlat: 'text-gray-600',
    // Large vibrant icon badge
    iconContainer: 'absolute top-6 right-6 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl',
    iconWrapper: 'text-white',
    iconWarning: 'text-red-500',
    progressTrack: 'bg-gray-200',
    progressFillOnTrack: 'bg-blue-500',
    progressFillMet: 'bg-emerald-500',
    progressLabel: 'text-gray-600',
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
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const titleSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const valueSizes = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-5xl'
  };

  const containerHover = variant === 'manager'
    ? 'group cursor-default transition-all duration-500 hover:scale-105 hover:-translate-y-2'
    : '';

  const titleColorFromIcon = (hex) => {
    switch (hex) {
      case '#38bdf8': return 'text-cyan-600';
      case '#f87171': return 'text-rose-600';
      case '#22c55e': return 'text-emerald-600';
      case '#facc15': return 'text-amber-600';
      case '#a855f7': return 'text-purple-600';
      case '#f97316': return 'text-orange-600';
      default: return theme.title;
    }
  };

  return (
    <div className={`rounded-3xl ${theme.container} ${containerHover} ${sizeClasses[size]} ${className}`}>
      {/* Colored accent bar on the left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl" 
        style={{ background: iconColor }}
      />

      <div className="relative">
        <div className="flex items-start">
          {/* Left content */}
          <div className="flex-1 pr-20">
            <p className={`${titleColorFromIcon(iconColor)} font-bold ${titleSizes[size]} mb-3 uppercase tracking-wider text-xs`}>{title}</p>
            <div className="flex items-baseline gap-2.5">
              <p className={`font-black ${theme.value} ${valueSizes[size]} tracking-tight leading-none`}>{formatValue(value)}</p>
              {unit && <span className={`${theme.unit} text-sm font-bold uppercase`}>{unit}</span>}
            </div>

            {trend && (
              <div className="mt-4 flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700' : 
                  trend.direction === 'down' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {trend.direction === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend.direction === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  <span className="text-xs font-bold">{trend.percentage ? `${trend.percentage.toFixed(1)}%` : trend.description}</span>
                </div>
              </div>
            )}

            {target && (
              <div className={`mt-3 ${theme.footer} text-xs`}>
                <div className="flex items-center justify-between">
                  <span className="opacity-80">Target</span>
                  <span className="font-semibold">{formatValue(target)}{unit}</span>
                </div>
                <div className={`w-full ${theme.progressTrack} rounded-full h-2 mt-2`}> 
                  <div className={`h-2 rounded-full ${value >= target ? theme.progressFillMet : theme.progressFillOnTrack}`} style={{ width: `${Math.min((value / target) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* empty spacer (could hold a small right-side element) */}
          <div className="w-3" />
        </div>

        {/* Icon badge (top-right) */}
        {Icon && (
          <div
            className={`${theme.iconContainer} ${isUnderTarget ? 'bg-red-500' : ''} group-hover:scale-110 transition-transform duration-500`}
            aria-hidden
            style={!isUnderTarget && iconColor ? { 
              background: `linear-gradient(135deg, ${iconColor} 0%, ${iconColor}dd 100%)`,
              boxShadow: `0 10px 30px ${iconColor}40`
            } : undefined}
          >
            <Icon className={`${theme.iconWrapper} w-7 h-7`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;