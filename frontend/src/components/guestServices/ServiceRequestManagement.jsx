import React, { useState, useEffect, useCallback, useContext } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Label from '../ui/Label';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Select from '../ui/Select';
import guestServiceApi from '../../services/guestServiceApi';
import { AuthContext } from '../../context/AuthContext';

// Map statuses to Badge variants
const statusVariants = {
  pending: 'warning',
  assigned: 'info',
  in_progress: 'secondary',
  completed: 'success',
  cancelled: 'danger'
};

const ServiceRequestManagement = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await guestServiceApi.getServiceRequests(filter);
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
    // Optimistic update
    setUpdatingId(requestId);
    const prev = requests;
    const rollback = () => setRequests(prev);
    const assignedTo = newStatus === 'assigned' ? (user?._id || user?.id || undefined) : undefined;

    setRequests((curr) => curr.map((r) => (r._id === requestId ? { ...r, status: newStatus, assignedTo: assignedTo || r.assignedTo } : r)));

    const attempt = async () => {
      try {
        await guestServiceApi.updateRequestStatus(requestId, newStatus, assignedTo, { timeoutMs: 16000 });
        showNotification('Status updated successfully');
        // Refresh to ensure server truth
        fetchRequests();
        return true;
      } catch (err) {
        return err;
      }
    };

    try {
      let res = await attempt();
      const isRetryable = (e) => e && e instanceof Error && (
        /timed out/i.test(e.message || '') || /canceled/i.test(e.message || '') || /network/i.test(e.message || '')
      );
      if (isRetryable(res)) {
        // Small backoff then retry once
        await new Promise(r => setTimeout(r, 500));
        res = await attempt();
      }
      if (res instanceof Error) throw res;
    } catch (error) {
      console.error('Error updating status:', error);
      rollback();
      const msg = error?.message || 'Failed to update status';
      showNotification(`Failed to update status: ${msg}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetails = async (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const details = await guestServiceApi.getRequestDetails(request._id);
      setSelectedRequest(details);
    } catch (err) {
      console.error('Failed to load request details:', err);
      showNotification('Failed to load full details', 'error');
    } finally {
      setDetailsLoading(false);
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

      <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="relative p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
              <span className="text-2xl">🛎️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Guest Service Requests</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track incoming guest requests</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full max-w-xs">
            <Select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filter Requests"
              className="w-full"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Button size="sm" variant="secondary" onClick={fetchRequests}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No service requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th scope="col" className="px-6 py-3">Request</th>
                  <th scope="col" className="px-6 py-3">Guest</th>
                  <th scope="col" className="px-6 py-3">Room</th>
                  <th scope="col" className="px-6 py-3">Priority</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {requests.map((request) => (
                  <tr key={request._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/70">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{request.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{request.description}</div>
                      {request.requestType && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Type: {request.requestType.replace('_', ' ')}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {request.isAnonymous ? 'Anonymous' : (request.guest?.name || '')}
                    </td>
                    <td className="px-6 py-4">{request.room?.roomNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        request.priority === 'urgent' ? 'danger' :
                        request.priority === 'high' ? 'warning' :
                        request.priority === 'medium' ? 'info' : 'secondary'
                      }>
                        {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1) || 'Medium'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariants[request.status]} className="w-fit inline-flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{formatRelativeTime(request.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => openDetails(request)}>View</Button>
                        <Button size="sm" variant="primary" disabled={updatingId === request._id} onClick={() => { setSelectedRequest(request); setShowActionsModal(true); }}>
                          {updatingId === request._id ? 'Working...' : 'Actions'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Request Details: ${selectedRequest?.title || ''}`} size="xl">
        {detailsLoading ? (
          <div className="flex justify-center items-center h-64"><Spinner /></div>
        ) : selectedRequest ? (
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <p className="mt-1 text-gray-700">{selectedRequest.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Guest</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.isAnonymous ? 'Anonymous' : (selectedRequest.guest?.name || '')}</p>
                {!selectedRequest.isAnonymous && (
                  <p className="text-sm text-gray-500">{selectedRequest.guest?.email || ''}{selectedRequest.guest?.phone ? ` • ${selectedRequest.guest.phone}` : ''}</p>
                )}
              </div>
              <div>
                <Label>Room</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.room?.roomNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge variant={statusVariants[selectedRequest.status]} className="inline-flex items-center gap-1">
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Priority</Label>
                <div className="mt-1">
                  <Badge variant={
                    selectedRequest.priority === 'urgent' ? 'danger' :
                    selectedRequest.priority === 'high' ? 'warning' :
                    selectedRequest.priority === 'medium' ? 'info' : 'secondary'
                  }>
                    {selectedRequest.priority?.charAt(0).toUpperCase() + selectedRequest.priority?.slice(1) || 'Medium'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned To</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <Label>Estimated Completion</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.estimatedCompletionTime ? formatDate(selectedRequest.estimatedCompletionTime) : 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Created</Label>
                <p className="mt-1 text-gray-700">{formatDate(selectedRequest.createdAt)}</p>
              </div>
              <div>
                <Label>Assigned</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.assignedAt ? formatDate(selectedRequest.assignedAt) : '—'}</p>
              </div>
              <div>
                <Label>Completed</Label>
                <p className="mt-1 text-gray-700">{selectedRequest.completedAt ? formatDate(selectedRequest.completedAt) : '—'}</p>
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
            {selectedRequest.notes?.length > 0 && (
              <div>
                <Label>Notes</Label>
                <div className="mt-2 space-y-2">
                  {selectedRequest.notes.map((note, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {note.addedBy ? `By ${note.addedBy.name || ''}` : 'By Staff'} • {formatRelativeTime(note.addedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button onClick={() => setShowDetailsModal(false)} variant="secondary">Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Actions Modal */}
      <Modal isOpen={showActionsModal && selectedRequest} onClose={() => setShowActionsModal(false)} title={`Actions for: ${selectedRequest?.title || ''}`} size="md">
        <div className="space-y-3">
          <Button onClick={() => { handleStatusUpdate(selectedRequest._id, 'assigned'); setShowActionsModal(false); }} disabled={selectedRequest?.status !== 'pending' || updatingId === selectedRequest?._id} variant="primary" className="w-full">Assign to Me</Button>
          <Button onClick={() => { handleStatusUpdate(selectedRequest._id, 'in_progress'); setShowActionsModal(false); }} disabled={!['pending', 'assigned'].includes(selectedRequest?.status) || updatingId === selectedRequest?._id} variant="secondary" className="w-full">Mark In Progress</Button>
          <Button onClick={() => { handleStatusUpdate(selectedRequest._id, 'completed'); setShowActionsModal(false); }} disabled={!['pending', 'assigned', 'in_progress'].includes(selectedRequest?.status) || updatingId === selectedRequest?._id} variant="success" className="w-full">Mark Completed</Button>
          <Button onClick={() => { handleStatusUpdate(selectedRequest._id, 'cancelled'); setShowActionsModal(false); }} disabled={selectedRequest?.status === 'completed' || updatingId === selectedRequest?._id} variant="danger" className="w-full">Cancel Request</Button>
          <Button onClick={() => { setShowNotesModal(true); setShowActionsModal(false); }} variant="ghost" className="w-full">Add Notes</Button>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
          <Button onClick={() => setShowActionsModal(false)} variant="secondary">Close</Button>
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