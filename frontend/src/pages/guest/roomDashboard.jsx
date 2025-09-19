import { useState, useEffect } from "react";
import FloorSelector from "./FloorSelector";
import roomService from "@/services/roomService";

export default function RoomsDashboard() {
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomService.getAllRooms(); // adjust params if needed
      const roomsData = response?.data?.data ?? [];
      setRooms(roomsData);

      // Build floors safely
      const uniqueFloors = [...new Set(roomsData.map((r) => r.floor))].sort(
        (a, b) => a - b
      );

      const floorsArr = uniqueFloors.map((floorNum) => {
        const roomsOnFloor = roomsData.filter((r) => r.floor === floorNum);

        return {
          id: `floor-${floorNum}`,
          number: floorNum,
          name: `Floor ${floorNum}`,
          description: `Total ${roomsOnFloor.length} room${
            roomsOnFloor.length !== 1 ? "s" : ""
          }`,
          roomCount: roomsOnFloor.length,
          occupancy: roomsOnFloor.reduce(
            (acc, r) => acc + (r.occupancy?.adults ?? 0) + (r.occupancy?.children ?? 0),
            0
          ),
          maxOccupancy: roomsOnFloor.reduce(
            (acc, r) => acc + (r.occupancy?.adults ?? 0) + (r.occupancy?.children ?? 0),
            0
          ),
          features: roomsOnFloor.flatMap((r) => r.amenities ?? []), // always an array
        };
      });

      setFloors(floorsArr);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };

  return (
    <div className="p-6">
      <FloorSelector
        floors={floors}
        selectedFloor={selectedFloor}
        onFloorSelect={setSelectedFloor}
      />
    </div>
  );
}