import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

const RevenueChart = ({ data, type = 'line', title = 'Revenue Trends' }) => {
  const formatCurrency = (value) => `LKR ${value.toLocaleString()}`;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{formatDate(label)}</p>
          <p className="text-green-600">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-blue-600">
              Orders: {payload[1].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Revenue</span>
          {type === 'line' && (
            <>
              <div className="w-3 h-3 bg-blue-500 rounded-full ml-4"></div>
              <span className="text-sm text-gray-600">Orders</span>
            </>
          )}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="_id" 
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                yAxisId="revenue"
                orientation="left"
                stroke="#10b981"
                fontSize={12}
                tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`}
              />
              {type === 'line' && (
                <YAxis 
                  yAxisId="orders"
                  orientation="right"
                  stroke="#3b82f6"
                  fontSize={12}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Line 
                yAxisId="revenue"
                type="monotone" 
                dataKey="totalRevenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="orders"
                type="monotone" 
                dataKey="orderCount" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="_id" 
                tickFormatter={formatDate}
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#10b981"
                fontSize={12}
                tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="totalRevenue" 
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {data && data.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0))}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-lg font-semibold text-blue-600">
              {data.reduce((sum, item) => sum + (item.orderCount || 0), 0)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Avg Order Value</p>
            <p className="text-lg font-semibold text-purple-600">
              {formatCurrency(
                data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0) / 
                Math.max(data.reduce((sum, item) => sum + (item.orderCount || 0), 0), 1)
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
