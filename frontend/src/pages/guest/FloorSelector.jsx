import React from 'react';

const FloorSelector = ({ floors, selectedFloor, onFloorSelect }) => {
  return (
    <div className="floor-selector">
      <h2 className="text-2xl font-bold mb-4">Select Floor</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floors.map((floor) => (
          <div
            key={floor.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedFloor?.id === floor.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => onFloorSelect(floor)}
          >
            <h3 className="text-lg font-semibold">{floor.name}</h3>
            <p className="text-sm text-gray-600">{floor.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              <p>Rooms: {floor.roomCount}</p>
              <p>Current Occupancy: {floor.occupancy}</p>
              <p>Max Occupancy: {floor.maxOccupancy}</p>
            </div>
          </div>
        ))}
      </div>
      {selectedFloor && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold">Selected: {selectedFloor.name}</h3>
          <p>{selectedFloor.description}</p>
        </div>
      )}
    </div>
  );
};

export default FloorSelector;