import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ 
  data, 
  xKey = 'name', 
  bars = [], 
  title, 
  height = 300,
  className = '',
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  layout = 'horizontal' // 'horizontal' or 'vertical'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const ChartComponent = layout === 'horizontal' ? BarChart : BarChart;

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={layout === 'horizontal' ? 'horizontal' : 'vertical'}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {layout === 'horizontal' ? (
            <>
              <XAxis type="category" dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis type="number" tick={{ fontSize: 12 }} />
            </>
          ) : (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey={xKey} tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip 
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name
            ]}
          />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color || colors[index % colors.length]}
              name={bar.name || bar.key}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;