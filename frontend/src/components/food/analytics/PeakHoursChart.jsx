import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, Activity } from 'lucide-react';

const PeakHoursChart = ({ data, type = 'bar', title = 'Peak Ordering Hours' }) => {
  const formatHour = (hour) => {
    const h = parseInt(hour);
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  };

  const formatCurrency = (value) => `LKR ${value.toLocaleString()}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{formatHour(label)}</p>
          <p className="text-blue-600">
            <Activity className="w-4 h-4 inline mr-1" />
            Orders: {payload[0].value}
          </p>
          <p className="text-green-600">
            Revenue: {formatCurrency(payload[1]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderBarChart = () => (
    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis 
        dataKey="_id" 
        tickFormatter={formatHour}
        stroke="#666"
        fontSize={12}
      />
      <YAxis 
        yAxisId="orders"
        orientation="left"
        stroke="#3b82f6"
        fontSize={12}
      />
      <YAxis 
        yAxisId="revenue"
        orientation="right"
        stroke="#10b981"
        fontSize={12}
        tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar 
        yAxisId="orders"
        dataKey="orderCount" 
        fill="#3b82f6"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  );

  const renderLineChart = () => (
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis 
        dataKey="_id" 
        tickFormatter={formatHour}
        stroke="#666"
        fontSize={12}
      />
      <YAxis 
        yAxisId="orders"
        orientation="left"
        stroke="#3b82f6"
        fontSize={12}
      />
      <YAxis 
        yAxisId="revenue"
        orientation="right"
        stroke="#10b981"
        fontSize={12}
        tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`}
      />
      <Tooltip content={<CustomTooltip />} />
      <Line 
        yAxisId="orders"
        type="monotone" 
        dataKey="orderCount" 
        stroke="#3b82f6" 
        strokeWidth={3}
        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
      />
      <Line 
        yAxisId="revenue"
        type="monotone" 
        dataKey="totalRevenue" 
        stroke="#10b981" 
        strokeWidth={2}
        dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
      />
    </LineChart>
  );

  // Find peak hours
  const peakHour = data?.reduce((max, item) => 
    item.orderCount > max.orderCount ? item : max, data[0] || {}
  );

  const totalOrders = data?.reduce((sum, item) => sum + (item.orderCount || 0), 0) || 0;
  const totalRevenue = data?.reduce((sum, item) => sum + (item.totalRevenue || 0), 0) || 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-500" />
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Orders</span>
          <div className="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
          <span className="text-sm text-gray-600">Revenue</span>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? renderBarChart() : renderLineChart()}
        </ResponsiveContainer>
      </div>
      
      {data && data.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Peak Hour</p>
                <p className="text-lg font-semibold text-blue-600">
                  {peakHour ? formatHour(peakHour._id) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  {peakHour?.orderCount || 0} orders
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-lg font-semibold text-green-600">{totalOrders}</p>
                <p className="text-xs text-gray-500">across all hours</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">₹</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-gray-500">peak hours revenue</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeakHoursChart;
