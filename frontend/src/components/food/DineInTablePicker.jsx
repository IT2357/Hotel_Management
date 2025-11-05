import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, X, Clock, Star } from 'lucide-react';
import FoodButton from './FoodButton';
import FoodSelect from './FoodSelect';
import FoodLabel from './FoodLabel';

const DineInTablePicker = ({ 
  selectedTable, 
  onTableChange, 
  className = '',
  disabled = false 
}) => {
  const [tables, setTables] = useState([]);
  const [tableStatus, setTableStatus] = useState({});

  // Initialize tables and their status
  useEffect(() => {
    const totalTables = 20;
    const tablesList = [];
    
    for (let i = 1; i <= totalTables; i++) {
      // Simulate table capacity and features
      let capacity = 2;
      let features = [];
      
      if (i <= 5) {
        capacity = 2; // Small tables
        features = ['Window view', 'Quiet area'];
      } else if (i <= 10) {
        capacity = 4; // Medium tables
        features = ['Family friendly', 'Spacious'];
      } else if (i <= 15) {
        capacity = 6; // Large tables
        features = ['Group seating', 'Private area'];
      } else {
        capacity = 8; // Extra large tables
        features = ['VIP section', 'Celebration area'];
      }
      
      tablesList.push({
        id: i.toString(),
        number: i,
        capacity,
        features,
        isAvailable: Math.random() > 0.3, // 70% availability
        isPopular: i >= 1 && i <= 5, // First 5 tables are popular
        location: i <= 5 ? 'Window' : i <= 10 ? 'Main' : i <= 15 ? 'Garden' : 'VIP'
      });
    }
    
    setTables(tablesList);
  }, []);

  const getTableStatus = (table) => {
    if (!table.isAvailable) {
      return {
        status: 'occupied',
        message: 'Currently occupied',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
    
    if (table.isPopular) {
      return {
        status: 'popular',
        message: 'Popular choice',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
    
    return {
      status: 'available',
      message: 'Available',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const handleTableChange = (tableId) => {
    onTableChange(tableId);
  };

  const availableTables = tables.filter(table => table.isAvailable);
  const selectedTableData = tables.find(table => table.id === selectedTable);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-[#FF9933] rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-[#4A4A4A] mb-2">Select Your Table</h3>
        <p className="text-sm text-[#4A4A4A]/70">
          Choose your preferred table for the best dining experience
        </p>
      </div>

      {/* Table selection dropdown */}
      <div className="space-y-3">
        <FoodLabel htmlFor="table-select">Available Tables</FoodLabel>
        <FoodSelect
          id="table-select"
          value={selectedTable}
          onChange={(e) => handleTableChange(e.target.value)}
          disabled={disabled}
          className="w-full"
        >
          <option value="">Select a table (optional)</option>
          {availableTables.map((table) => (
            <option key={table.id} value={table.id}>
              Table {table.number} - {table.capacity} seats ({table.location})
            </option>
          ))}
        </FoodSelect>
      </div>

      {/* Table grid */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-[#4A4A4A]">Table Layout</div>
        
        {/* Window tables */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-[#4A4A4A]/70">Window Tables (1-5)</div>
          <div className="grid grid-cols-5 gap-2">
            {tables.slice(0, 5).map((table) => {
              const status = getTableStatus(table);
              const isSelected = selectedTable === table.id;
              
              return (
                <motion.button
                  key={table.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => table.isAvailable && handleTableChange(table.id)}
                  disabled={!table.isAvailable || disabled}
                  className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-[#FF9933] bg-[#FF9933]/10'
                      : table.isAvailable
                      ? `${status.borderColor} ${status.bgColor} hover:border-[#FF9933]/50`
                      : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#4A4A4A]">
                    {table.number}
                  </div>
                  <div className="text-xs text-[#4A4A4A]/70">
                    {table.capacity} seats
                  </div>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9933] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {!table.isAvailable && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {table.isPopular && table.isAvailable && !isSelected && (
                    <div className="absolute -top-1 -left-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Main area tables */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-[#4A4A4A]/70">Main Area (6-10)</div>
          <div className="grid grid-cols-5 gap-2">
            {tables.slice(5, 10).map((table) => {
              const status = getTableStatus(table);
              const isSelected = selectedTable === table.id;
              
              return (
                <motion.button
                  key={table.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => table.isAvailable && handleTableChange(table.id)}
                  disabled={!table.isAvailable || disabled}
                  className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-[#FF9933] bg-[#FF9933]/10'
                      : table.isAvailable
                      ? `${status.borderColor} ${status.bgColor} hover:border-[#FF9933]/50`
                      : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#4A4A4A]">
                    {table.number}
                  </div>
                  <div className="text-xs text-[#4A4A4A]/70">
                    {table.capacity} seats
                  </div>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9933] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {!table.isAvailable && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Garden tables */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-[#4A4A4A]/70">Garden Area (11-15)</div>
          <div className="grid grid-cols-5 gap-2">
            {tables.slice(10, 15).map((table) => {
              const status = getTableStatus(table);
              const isSelected = selectedTable === table.id;
              
              return (
                <motion.button
                  key={table.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => table.isAvailable && handleTableChange(table.id)}
                  disabled={!table.isAvailable || disabled}
                  className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-[#FF9933] bg-[#FF9933]/10'
                      : table.isAvailable
                      ? `${status.borderColor} ${status.bgColor} hover:border-[#FF9933]/50`
                      : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#4A4A4A]">
                    {table.number}
                  </div>
                  <div className="text-xs text-[#4A4A4A]/70">
                    {table.capacity} seats
                  </div>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9933] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {!table.isAvailable && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* VIP tables */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-[#4A4A4A]/70">VIP Section (16-20)</div>
          <div className="grid grid-cols-5 gap-2">
            {tables.slice(15, 20).map((table) => {
              const status = getTableStatus(table);
              const isSelected = selectedTable === table.id;
              
              return (
                <motion.button
                  key={table.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => table.isAvailable && handleTableChange(table.id)}
                  disabled={!table.isAvailable || disabled}
                  className={`relative p-3 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-[#FF9933] bg-[#FF9933]/10'
                      : table.isAvailable
                      ? `${status.borderColor} ${status.bgColor} hover:border-[#FF9933]/50`
                      : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#4A4A4A]">
                    {table.number}
                  </div>
                  <div className="text-xs text-[#4A4A4A]/70">
                    {table.capacity} seats
                  </div>
                  
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9933] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {!table.isAvailable && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected table info */}
      {selectedTableData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FF9933]/10 border border-[#FF9933]/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#FF9933]" />
            <div>
              <div className="font-medium text-[#4A4A4A]">
                Table {selectedTableData.number} selected
              </div>
              <div className="text-sm text-[#4A4A4A]/70">
                {selectedTableData.capacity} seats • {selectedTableData.location} area
              </div>
              <div className="text-xs text-[#4A4A4A]/60 mt-1">
                Features: {selectedTableData.features.join(', ')}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table status legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm font-medium text-[#4A4A4A] mb-3">Table Status</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-[#4A4A4A]/70">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-[#4A4A4A]/70">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF9933]/20 border border-[#FF9933]/40 rounded"></div>
            <span className="text-[#4A4A4A]/70">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-[#4A4A4A]/70">Popular</span>
          </div>
        </div>
      </div>

      {/* Optional note */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Table Selection Optional
            </h4>
            <p className="text-xs text-blue-700">
              You can place your order without selecting a table. 
              We'll assign you the best available table when you arrive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DineInTablePicker;
