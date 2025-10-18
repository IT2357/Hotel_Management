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
    container: 'bg-[#0e1f42] border border-[#162a52] rounded-2xl shadow-[0_18px_40px_rgba(8,14,29,0.55)] backdrop-blur-sm',
    title: 'text-[#f5f7ff]',
    empty: 'text-[#8ba3d0]',
    legend: { fontSize: '12px', color: '#bcd1ff' },
    tooltipBg: '#0f2349',
    tooltipLabel: '#f5f7ff',
    tooltipValue: '#f5f7ff',
  }
};

const PieChartComponent = ({ 
  data, 
  dataKey = 'value', 
  nameKey = 'name',
  title, 
  height = 300,
  className = '',
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
  showLegend = true,
  innerRadius = 0, // Set to > 0 for donut chart
  showLabels = true,
  variant = 'light'
}) => {
  const theme = THEMES[variant] ?? THEMES.light;

  if (!data || data.length === 0) {
    return (
      <div className={`p-4 ${theme.container} ${className}`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.title}`}>{title}</h3>
        <div className={`flex items-center justify-center h-48 ${theme.empty}`}>
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
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`p-4 ${theme.container} ${className}`}>
      {title && <h3 className={`text-lg font-semibold mb-4 ${theme.title}`}>{title}</h3>}
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
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}
            labelStyle={{ color: theme.tooltipLabel }}
            itemStyle={{ color: theme.tooltipValue }}
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