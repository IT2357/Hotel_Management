// 📁 frontend/pages/admin/AdminRoomsPage.jsx
import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import Pagination from "../../components/ui/Pagination";

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: "",
    status: "",
    search: "",
  });
  const [pagination, setPagination] = useState({});

  // Mock data - replace with actual API later
  useEffect(() => {
    fetchRooms();
  }, [filters]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // mock delay
      const mockRooms = [
        {
          _id: "r1",
          roomNumber: "101",
          type: "Deluxe",
          floor: 1,
          status: "Available",
          basePrice: 150,
          occupancy: { adults: 2, children: 1 },
        },
        {
          _id: "r2",
          roomNumber: "205",
          type: "Suite",
          floor: 2,
          status: "Booked",
          basePrice: 300,
          occupancy: { adults: 3, children: 0 },
        },
      ];
      setRooms(mockRooms);
      setPagination({ page: 1, limit: 20, total: mockRooms.length, pages: 1 });
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Available: "bg-green-100 text-green-800",
      Booked: "bg-blue-100 text-blue-800",
      Maintenance: "bg-yellow-100 text-yellow-800",
      Cleaning: "bg-purple-100 text-purple-800",
      OutOfService: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">Room Management</h1>
          <p className="text-gray-600 mt-1">
            Manage hotel rooms, availability, and pricing
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search by room number..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
            />
            <Select
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value, page: 1 })
              }
            >
              <option value="">All Types</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Executive">Executive</option>
            </Select>
            <Select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Cleaning">Cleaning</option>
              <option value="OutOfService">Out of Service</option>
            </Select>
            <Button onClick={fetchRooms}>Apply Filters</Button>
            <Button variant="primary">+ Add Room</Button>
          </div>
        </div>

        {/* Room List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Floor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/Night
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No rooms found
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            Room {room.roomNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {room._id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {room.type}
                          </div>
                          <div className="text-sm text-gray-500">
                            Floor {room.floor}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {room.occupancy.adults} Adults, {room.occupancy.children} Children
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${room.basePrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(room.status)}>
                          {room.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm">Edit</Button>
                          <Button size="sm" variant="danger">
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card title="Total Rooms" className="p-6">
            <div className="text-3xl font-bold text-indigo-600">
              {rooms.length}
            </div>
            <p className="text-gray-600">All registered rooms</p>
          </Card>
          <Card title="Available" className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {rooms.filter((r) => r.status === "Available").length}
            </div>
            <p className="text-gray-600">Ready to book</p>
          </Card>
          <Card title="Booked" className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {rooms.filter((r) => r.status === "Booked").length}
            </div>
            <p className="text-gray-600">Currently reserved</p>
          </Card>
          <Card title="Maintenance" className="p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {rooms.filter((r) => r.status === "Maintenance").length}
            </div>
            <p className="text-gray-600">Unavailable for service</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
