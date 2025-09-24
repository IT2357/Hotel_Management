import React from 'react';
import { motion } from 'framer-motion';
import { Building, MapPin } from 'lucide-react';
import { Button } from '@/components/rooms/ui/button';
import { Badge } from '@/components/rooms/ui/badge';

export const FloorSelection = ({
  floors,
  selectedFloor,
  onFloorSelect
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Building className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-gradient">Select Floor</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* All Floors Option */}
        <motion.div
          className={`relative overflow-hidden rounded-lg p-6 cursor-pointer transition-all duration-300 ${
            selectedFloor === null 
              ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 border-2 border-indigo-400 shadow-lg shadow-indigo-500/25' 
              : 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10'
          }`}
          onClick={() => onFloorSelect(null)}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-indigo-600/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-indigo-400/30">
              <MapPin className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">All Floors</h3>
              <p className="text-sm text-indigo-200">View all available rooms</p>
            </div>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
              {floors.reduce((sum, floor) => sum + floor.availableRooms, 0)} rooms
            </Badge>
          </div>
        </motion.div>

        {/* Individual Floors */}
        {floors.map((floor, index) => (
          <motion.div
            key={floor.number}
            className={`relative overflow-hidden rounded-lg p-6 cursor-pointer transition-all duration-300 ${
              selectedFloor === floor.number 
                ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 border-2 border-indigo-400 shadow-lg shadow-indigo-500/25' 
                : 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10'
            }`}
            onClick={() => onFloorSelect(floor.number)}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-indigo-600/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-indigo-400/30">
                <span className="text-2xl font-bold text-indigo-300">{floor.number}</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-white">Floor {floor.number}</h3>
                <p className="text-sm text-indigo-200">View available rooms</p>
              </div>
              <Badge 
                variant="secondary"
                className="bg-white/10 text-white border-white/20 backdrop-blur-sm"
              >
                {floor.availableRooms} room{floor.availableRooms !== 1 ? 's' : ''}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedFloor && (
        <motion.div 
          className="flex items-center justify-center gap-2 mt-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button
            variant="outline"
            onClick={() => onFloorSelect(null)}
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-indigo-400 transition-colors"
          >
            Clear Floor Filter
          </Button>
        </motion.div>
      )}
    </section>
  );
};