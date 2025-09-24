import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Label from '../../components/ui/Label';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import guestServiceApi from '../../services/guestServiceApi';

const statusColors = {
  pending: 'warning',
  assigned: 'info',
  in_progress: 'purple',
  completed: 'success',
  cancelled: 'failure'
};

const ServiceRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await guestServiceApi.getServiceRequests(filter === 'all' ? '' : filter);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showNotification('Failed to fetch service requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
    // Replaced Socket.IO with polling for real-time updates
    const intervalId = setInterval(fetchRequests, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchRequests]);

  // Custom function to format time relatively
  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    return 'just now';
  };

  // Custom function to format a full date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const assignedTo = newStatus === 'assigned' ? 'current-user-id' : null;
      await guestServiceApi.updateRequestStatus(requestId, newStatus, assignedTo);
      showNotification('Status updated successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Failed to update status', 'error');
    }
  };

  const handleAddNotes = async () => {
    if (!notes.trim() || !selectedRequest) return;

    try {
      await guestServiceApi.addRequestNotes(selectedRequest._id, notes);
      setNotes('');
      setShowNotesModal(false);
      showNotification('Note added successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error adding note:', error);
      showNotification('Failed to add note', 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <span className="mr-1">🕒</span>;
      case 'assigned': return <span className="mr-1">👤</span>;
      case 'in_progress': return <span className="mr-1">⚠️</span>;
      case 'completed': return <span className="mr-1">✓</span>;
      case 'cancelled': return <span className="mr-1">✗</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div
          className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Guest Service Requests</h2>
        <div className="flex space-x-2">
          <Select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filter Requests"
            className="w-48"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Button size="sm" onClick={fetchRequests}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No service requests found</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Request</th>
                <th scope="col" className="px-6 py-3">Guest</th>
                <th scope="col" className="px-6 py-3">Room</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Created</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request._id} className="bg-white hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{request.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{request.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    {request.isAnonymous ? 'Anonymous' : `${request.guest?.firstName || ''} ${request.guest?.lastName || ''}`}
                  </td>
                  <td className="px-6 py-4">{request.room?.number || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <Badge color={statusColors[request.status]} className="w-fit inline-flex items-center">
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">{formatRelativeTime(request.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Button size="xs" color="gray" onClick={() => { setSelectedRequest(request); setShowDetailsModal(true); }}>View</Button>
                      <Button size="xs" color="blue" onClick={() => { setSelectedRequest(request); setShowActionsModal(true); }}>Actions</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Request Details: ${selectedRequest?.title || ''}`} size="xl">
        {selectedRequest && (
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <p className="mt-1 text-gray-700">{selectedRequest.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Guest</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.isAnonymous ? 'Anonymous' : `${selectedRequest.guest?.firstName || ''} ${selectedRequest.guest?.lastName || ''}`}</p>
              </div>
              <div>
                <Label>Room</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.room?.number || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge color={statusColors[selectedRequest.status]} className="inline-flex items-center">
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Created</Label>
                <p className="mt-1 text-gray-700">{formatDate(selectedRequest.createdAt)}</p>
              </div>
            </div>
            {selectedRequest.specialInstructions && (
              <div>
                <Label>Special Instructions</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.specialInstructions}</p>
              </div>
            )}
            {selectedRequest.attachments?.length > 0 && (
              <div>
                <Label>Attachments</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {selectedRequest.attachments.map((file, index) => (
                    <div key={index} className="border rounded-md p-2">
                      {file.url && file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={file.url} alt={file.filename} className="h-24 w-full object-cover" />
                      ) : (
                        <div className="h-24 flex items-center justify-center bg-gray-100">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">{file.filename}</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button onClick={() => setShowDetailsModal(false)} variant="secondary">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Actions Modal */}
      <Modal isOpen={showActionsModal && selectedRequest} onClose={() => setShowActionsModal(false)} title={`Actions for: ${selectedRequest?.title || ''}`} size="md">
        <div className="space-y-3">
          <Button onClick={() => { handleStatusUpdate(selectedRequest._id, 'assigned'); setShowActionsModal(false); }} disabled={selectedRequest?.status !== 'pending'} variant="primary" className="w-full">Assign to Me</Button>
          <Button onClick={() => { handleStatusUpdate(selectedRequest._id, 'in_progress'); setShowActionsModal(false); }} disabled={!['pending', 'assigned'].includes(selectedRequest?.status)} variant="secondary" className="w-full">Mark In Progress</Button>
          <Button onClick={() => { handleStatusUpdate(selectedRequest._id, 'completed'); setShowActionsModal(false); }} disabled={!['pending', 'assigned', 'in_progress'].includes(selectedRequest?.status)} variant="success" className="w-full">Mark Completed</Button>
          <Button onClick={() => { setShowNotesModal(true); setShowActionsModal(false); }} variant="ghost" className="w-full">Add Notes</Button>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
          <Button onClick={() => setShowActionsModal(false)} variant="secondary">Cancel</Button>
        </div>
      </Modal>

      {/* Add Notes Modal */}
      <Modal isOpen={showNotesModal && selectedRequest} onClose={() => setShowNotesModal(false)} title="Add Notes to Request" size="md">
        <div className="space-y-4">
          <div>
            <Label>Notes</Label>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter any additional notes about this request..." />
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={() => setShowNotesModal(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleAddNotes} variant="primary">Save Notes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServiceRequestManagement;