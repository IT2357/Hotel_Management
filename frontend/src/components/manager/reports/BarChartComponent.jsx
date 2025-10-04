import React from 'react';

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

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="bg-gray-50 rounded p-4" style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-600">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Bar Chart Component</p>
            <p className="text-sm text-gray-500 mt-1">
              {data.length} data points available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChartComponent;