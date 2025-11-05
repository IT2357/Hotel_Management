import React from 'react';
import useTitle from '../../hooks/useTitle';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

export default function SchedulePage() {
  useTitle('My Schedule');

  // Mock schedule data - in a real implementation, this would come from an API
  const schedule = [
    {
      id: 1,
      date: '2025-09-23',
      shift: 'Morning',
      time: '08:00 - 16:00',
      tasks: ['Check-in assistance', 'Room cleaning supervision']
    },
    {
      id: 2,
      date: '2025-09-24',
      shift: 'Evening',
      time: '16:00 - 00:00',
      tasks: ['Guest service', 'Night audit']
    },
    {
      id: 3,
      date: '2025-09-25',
      shift: 'Morning',
      time: '08:00 - 16:00',
      tasks: ['Front desk', 'Maintenance coordination']
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Work Schedule</h1>
        <p className="text-gray-600">View your upcoming shifts and assigned tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedule.map((shift) => (
          <div key={shift.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FiCalendar className="text-indigo-600 mr-3" />
              <div>
                <h3 className="font-semibold text-lg">{shift.date}</h3>
                <p className="text-sm text-gray-600">{shift.shift} Shift</p>
              </div>
            </div>

            <div className="flex items-center mb-4">
              <FiClock className="text-gray-500 mr-2" />
              <span className="text-sm">{shift.time}</span>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Assigned Tasks:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {shift.tasks.map((task, index) => (
                  <li key={index} className="flex items-center">
                    <FiUser className="mr-2 text-xs" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t">
              <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-300">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Schedule Notes</h3>
        <p className="text-blue-800 text-sm">
          This is a placeholder schedule page. In a full implementation, this would display your actual work schedule
          with the ability to request time off, swap shifts, and view detailed task assignments.
        </p>
      </div>
    </div>
  );
}
