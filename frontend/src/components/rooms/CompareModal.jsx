import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, BarChart3, Users, Bed, Maximize, Wifi, Car, Coffee, Bath } from 'lucide-react';
import { Button } from '@/components/rooms/ui/button';
import { Badge } from '@/components/rooms/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/rooms/ui/card';

const amenityIcons = {
  WiFi: Wifi,
  Parking: Car,
  Coffee: Coffee,
  Bathtub: Bath,
};

export const CompareFeature = ({ rooms, onRemove, onClear }) => {
  const navigate = useNavigate();
  
  if (rooms.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="w-80 max-h-96 overflow-hidden rounded-2xl bg-gray-900/90 backdrop-blur-lg border border-gray-700/50 shadow-2xl">
          {/* Header */}
          <div className="p-4 pb-3 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Compare Rooms</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="hover:bg-red-500/20 hover:text-red-400 text-gray-400 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Room List */}
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/30 hover:bg-gray-800/80 transition-colors"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <img 
                  src={room.image} 
                  alt={room.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-white truncate">{room.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>${room.price}/night</span>
                    <span>•</span>
                    <span>{room.view}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(room.id)}
                  className="hover:bg-red-500/20 hover:text-red-400 text-gray-400 p-1 h-auto"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
            
            {rooms.length < 3 && (
              <motion.div 
                className="text-center py-4 px-4 rounded-xl border-2 border-dashed border-gray-600/50 bg-gray-800/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs text-gray-400">
                  Add {3 - rooms.length} more room{3 - rooms.length !== 1 ? 's' : ''} to compare
                </p>
              </motion.div>
            )}
          </div>
          
          {/* Compare Button */}
          {rooms.length > 1 && (
            <div className="p-4 pt-0">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium transition-colors"
                onClick={() => {
                  // Navigate to comparison page in same window
                  const roomIds = rooms.map(r => r.id).join(',');
                  navigate(`/compare-rooms?rooms=${roomIds}`);
                }}
              >
                Compare Details
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};