import React from 'react';
import { Table, Badge, Button } from 'flowbite-react';
import moment from 'moment';

const CurrentGuestsList = ({ guests = [], isLoading, onCheckOut, onSelectBooking }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No current guests found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <Table hoverable>
        <Table.Head>
          <Table.HeadCell>Guest</Table.HeadCell>
          <Table.HeadCell>Room</Table.HeadCell>
          <Table.HeadCell>Check-In Time</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell>Actions</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {guests.map((guest) => (
            <Table.Row key={guest._id} className="bg-white hover:bg-gray-50">
              <Table.Cell>
                <div className="font-medium text-gray-900">
                  {guest.guest?.firstName} {guest.guest?.lastName}
                </div>
                <div className="text-sm text-gray-500">{guest.guest?.email}</div>
              </Table.Cell>
              <Table.Cell>
                <div className="font-medium">{guest.room?.number}</div>
                <div className="text-sm text-gray-500">{guest.room?.type}</div>
              </Table.Cell>
              <Table.Cell>
                {moment(guest.checkInTime).format('MMM D, YYYY h:mm A')}
              </Table.Cell>
              <Table.Cell>
                <Badge 
                  color={guest.status === 'checked_in' ? 'success' : 'warning'}
                  className="w-fit"
                >
                  {guest.status === 'checked_in' ? 'Checked In' : 'Pre Check-In'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className="flex space-x-2">
                  <Button 
                    size="xs" 
                    color="blue"
                    onClick={() => onSelectBooking(guest.booking)}
                  >
                    Details
                  </Button>
                  <Button 
                    size="xs" 
                    color="red"
                    onClick={() => onCheckOut(guest._id)}
                  >
                    Check Out
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default CurrentGuestsList;
