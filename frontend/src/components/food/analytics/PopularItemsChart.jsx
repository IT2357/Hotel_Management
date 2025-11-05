import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, TrendingUp } from 'lucide-react';

const PopularItemsChart = ({ data, type = 'bar', title = 'Popular Menu Items' }) => {
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  const formatCurrency = (value) => `LKR ${value.toLocaleString()}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-green-600">
            <Star className="w-4 h-4 inline mr-1" />
            Sold: {payload[0].value} units
          </p>
          <p className="text-blue-600">
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
        dataKey="name" 
        stroke="#666"
        fontSize={12}
        angle={-45}
        textAnchor="end"
        height={80}
      />
      <YAxis 
        stroke="#10b981"
        fontSize={12}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar 
        dataKey="totalQuantitySold" 
        fill="#10b981"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  );

  const renderPieChart = () => (
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="totalQuantitySold"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => [`${value} units`, 'Quantity Sold']} />
    </PieChart>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Quantity Sold</span>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? renderBarChart() : renderPieChart()}
        </ResponsiveContainer>
      </div>
      
      {data && data.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.slice(0, 5).map((item, index) => (
              <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.totalRevenue || 0)} revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{item.totalQuantitySold}</p>
                  <p className="text-xs text-gray-500">units sold</p>
                </div>
              </div>
            ))}
          </div>
          
          {data.length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing top 5 of {data.length} items
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PopularItemsChart;
