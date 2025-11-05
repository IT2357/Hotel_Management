import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    container: 'bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 rounded-3xl shadow-xl border border-gray-200/50',
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

const BarChartComponent = ({ 
  data, 
  xKey = 'name', 
  bars = [], 
  title, 
  height = 300,
  className = '',
  colors = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#14b8a6'],
  layout = 'horizontal', // 'horizontal' or 'vertical'
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

  const ChartComponent = layout === 'horizontal' ? BarChart : BarChart;

  return (
    <div className={`p-6 ${theme.container} ${className}`}>
      {title && <h3 className={`text-base font-bold mb-5 ${theme.title} uppercase tracking-wider`}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={layout === 'horizontal' ? 'horizontal' : 'vertical'}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.grid} 
            strokeOpacity={0.5}
            horizontal={true}
            vertical={false}
          />
          {layout === 'horizontal' ? (
            <>
              <XAxis 
                type="category" 
                dataKey={xKey} 
                tick={{ fontSize: 11, fill: theme.axis, fontWeight: 700 }}
                axisLine={{ stroke: theme.axis, strokeWidth: 1.5 }}
                tickLine={false}
              />
              <YAxis 
                type="number" 
                tick={{ fontSize: 11, fill: theme.axis, fontWeight: 700 }}
                axisLine={{ stroke: theme.axis, strokeWidth: 1.5 }}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis 
                type="number" 
                tick={{ fontSize: 11, fill: theme.axis, fontWeight: 700 }}
                axisLine={{ stroke: theme.axis, strokeWidth: 1.5 }}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey={xKey} 
                tick={{ fontSize: 11, fill: theme.axis, fontWeight: 700 }}
                axisLine={{ stroke: theme.axis, strokeWidth: 1.5 }}
                tickLine={false}
              />
            </>
          )}
          <Tooltip 
            contentStyle={{ backgroundColor: theme.tooltipBg, borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            labelStyle={{ color: theme.tooltipLabel, fontWeight: '700' }}
            itemStyle={{ color: theme.tooltipValue, fontWeight: '600' }}
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name
            ]}
          />
          <Legend wrapperStyle={{ color: theme.legend }} />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color || colors[index % colors.length]}
              name={bar.name || bar.key}
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;