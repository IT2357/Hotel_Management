import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const THEMES = {
  light: {
    container: 'bg-white rounded-lg shadow',
    title: 'text-gray-900',
    empty: 'text-gray-500',
    grid: '#E5E7EB',
    axis: '#6B7280',
    legend: '#374151',
    tooltipBg: '#ffffff',
    tooltipLabel: '#111827',
    tooltipValue: '#111827',
  },
  manager: {
    container: 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl shadow-xl border border-gray-200/50',
    title: 'text-gray-900',
    empty: 'text-gray-500',
    grid: '#e5e7eb',
    axis: '#6b7280',
    legend: '#4b5563',
    tooltipBg: 'rgba(255, 255, 255, 0.98)',
    tooltipLabel: '#111827',
    tooltipValue: '#374151',
  }
};

const LineChartComponent = ({ 
  data, 
  xKey = 'date', 
  lines = [], 
  title, 
  height = 300,
  className = '',
  colors = ['#0ea5e9', '#22c55e', '#f97316', '#d946ef', '#06b6d4', '#eab308'],
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

  return (
    <div className={`p-6 ${theme.container} ${className}`}>
      {title && <h3 className={`text-base font-bold mb-5 ${theme.title} uppercase tracking-wider`}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.grid} 
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 11, fill: theme.axis, fontWeight: 700 }}
            axisLine={{ stroke: theme.axis, strokeWidth: 1.5 }}
            tickLine={false}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.includes('-')) {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              return value;
            }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: theme.axis, fontWeight: 700 }}
            axisLine={{ stroke: theme.axis, strokeWidth: 1.5 }}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            labelStyle={{ color: theme.tooltipLabel, fontWeight: '700' }}
            itemStyle={{ color: theme.tooltipValue, fontWeight: '600' }}
            labelFormatter={(value) => {
              if (typeof value === 'string' && value.includes('-')) {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              }
              return value;
            }}
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name
            ]}
          />
          <Legend wrapperStyle={{ color: theme.legend }} />
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color || colors[index % colors.length]}
              strokeWidth={3.5}
              dot={{ 
                r: 5, 
                strokeWidth: 2.5, 
                stroke: line.color || colors[index % colors.length],
                fill: '#ffffff'
              }}
              activeDot={{ 
                r: 8, 
                strokeWidth: 3, 
                stroke: line.color || colors[index % colors.length],
                fill: '#ffffff',
                style: { filter: 'drop-shadow(0 0 6px ' + (line.color || colors[index % colors.length]) + ')' }
              }}
              name={line.name || line.key}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;