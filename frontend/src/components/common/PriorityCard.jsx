import React from 'react';
import { TrendingDown, AlertTriangle, Activity, CheckCircle } from 'lucide-react';

const PRIORITY_STYLES = {
  critical: {
    gradient: 'from-red-50 to-rose-50',
    border: 'border-red-200',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    iconColor: 'text-white',
    label: 'text-red-700',
    count: 'text-gray-900',
    badge: 'bg-red-100',
    icon: TrendingDown
  },
  high: {
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconColor: 'text-white',
    label: 'text-amber-700',
    count: 'text-gray-900',
    badge: 'bg-amber-100',
    icon: AlertTriangle
  },
  medium: {
    gradient: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    iconColor: 'text-white',
    label: 'text-blue-700',
    count: 'text-gray-900',
    badge: 'bg-blue-100',
    icon: Activity
  },
  low: {
    gradient: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    iconColor: 'text-white',
    label: 'text-emerald-700',
    count: 'text-gray-900',
    badge: 'bg-emerald-100',
    icon: CheckCircle
  }
};

const PriorityCard = ({ 
  priority = 'low', 
  count = 0, 
  label,
  onClick,
  className = '' 
}) => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
  const Icon = style.icon;
  const displayLabel = label || priority.toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border-2 ${style.border}
        bg-gradient-to-br ${style.gradient} p-6
        transition-all duration-300 hover:scale-105 hover:shadow-lg
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
        <div className={`w-full h-full rounded-full ${style.iconBg}`} />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-xs font-bold ${style.label} uppercase tracking-widest mb-3`}>
            {displayLabel}
          </p>
          <p className={`text-4xl font-black ${style.count}`}>
            {count}
          </p>
        </div>

        {/* Icon Badge */}
        <div className={`flex-shrink-0 ml-4 p-4 rounded-2xl ${style.iconBg} shadow-lg`}>
          <Icon className={`w-8 h-8 ${style.iconColor}`} />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`mt-4 h-1 w-full rounded-full ${style.iconBg} opacity-20`} />
    </div>
  );
};

export default PriorityCard;
