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
    container: 'bg-[#0e1f42] border border-[#162a52] rounded-2xl shadow-[0_18px_40px_rgba(8,14,29,0.55)] backdrop-blur-sm',
    title: 'text-[#f5f7ff]',
    empty: 'text-[#8ba3d0]',
    grid: 'rgba(138,163,208,0.2)',
    axis: '#d6e2ff',
    legend: '#bcd1ff',
    tooltipBg: '#0f2349',
    tooltipLabel: '#f5f7ff',
    tooltipValue: '#f5f7ff',
  }
};

const LineChartComponent = ({ 
  data, 
  xKey = 'date', 
  lines = [], 
  title, 
  height = 300,
  className = '',
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
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

  return (
    <div className={`p-4 ${theme.container} ${className}`}>
      {title && <h3 className={`text-lg font-semibold mb-4 ${theme.title}`}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12, fill: theme.axis }}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.includes('-')) {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 12, fill: theme.axis }} />
          <Tooltip 
            contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}
            labelStyle={{ color: theme.tooltipLabel }}
            itemStyle={{ color: theme.tooltipValue }}
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
              strokeWidth={2}
              dot={{ r: 3 }}
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