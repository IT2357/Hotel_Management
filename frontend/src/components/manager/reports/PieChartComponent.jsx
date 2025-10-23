import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const THEMES = {
  light: {
    container: 'bg-white rounded-lg shadow',
    title: 'text-gray-900',
    empty: 'text-gray-500',
    legend: { fontSize: '12px', color: '#374151' },
    tooltipBg: '#ffffff',
    tooltipLabel: '#111827',
    tooltipValue: '#111827',
  },
  manager: {
    container: 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-3xl shadow-xl border border-gray-200/50',
    title: 'text-gray-900',
    empty: 'text-gray-500',
    legend: { fontSize: '12px', color: '#4b5563', fontWeight: '600' },
    tooltipBg: 'rgba(255, 255, 255, 0.98)',
    tooltipLabel: '#111827',
    tooltipValue: '#374151',
  }
};

const PieChartComponent = ({ 
  data, 
  dataKey = 'value', 
  nameKey = 'name',
  title, 
  height = 300,
  className = '',
  colors = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#eab308'],
  showLegend = true,
  innerRadius = 0, // Set to > 0 for donut chart
  showLabels = true,
  variant = 'light'
}) => {
  const theme = THEMES[variant] ?? THEMES.light;

  if (!data || data.length === 0) {
    return (
      <div className={`p-6 ${theme.container} ${className}`}>
        <h3 className={`text-base font-bold mb-5 ${theme.title} uppercase tracking-wider`}>{title}</h3>
        <div className={`flex items-center justify-center h-48 ${theme.empty} text-sm font-medium`}>
          No data available
        </div>
      </div>
    );
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (!showLabels || percent < 0.05) return null; // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#1f2937" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="800"
        style={{ 
          stroke: '#ffffff',
          strokeWidth: 3,
          paintOrder: 'stroke'
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`p-6 ${theme.container} ${className}`}>
      {title && <h3 className={`text-base font-bold mb-5 ${theme.title} uppercase tracking-wider`}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={Math.min(height * 0.35, 120)}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
            paddingAngle={3}
            stroke="#ffffff"
            strokeWidth={2.5}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                style={{ 
                  opacity: 0.95
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            labelStyle={{ color: theme.tooltipLabel, fontWeight: '700' }}
            itemStyle={{ color: theme.tooltipValue, fontWeight: '600' }}
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name
            ]}
          />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={theme.legend}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;