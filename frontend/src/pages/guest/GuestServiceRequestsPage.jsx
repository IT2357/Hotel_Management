import React, { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import io from 'socket.io-client';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Label from '../../components/ui/Label';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner'; // Added Spinner import
import moment from 'moment';


const socket = io('http://localhost:5000');

const statusColors = {
  pending: 'warning',
  assigned: 'info',
  in_progress: 'purple',
  completed: 'success',
  cancelled: 'failure'
};

const GuestServiceRequestsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });

  // Use useCallback to memoize the function and prevent unnecessary re-creations
  const fetchMyRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/guest-services/my-requests');
      console.log('Guest requests with attachments:', response.data);
      setRequests(response.data);
    } catch (error) {
      enqueueSnackbar('Failed to load your service requests', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchMyRequests();

    socket.on('guestServiceRequestUpdated', (updatedRequest) => {
      // Only update if this request belongs to the current user
      if (updatedRequest.guest && updatedRequest.guest.toString() === user.userId) {
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request._id === updatedRequest._id ? updatedRequest : request
          )
        );
        enqueueSnackbar(`Your request "${updatedRequest.title}" has been updated`, { variant: 'info' });
      }
    });

    return () => {
      socket.off('guestServiceRequestUpdated');
    };
  }, [user, enqueueSnackbar, fetchMyRequests]); // Added fetchMyRequests to dependency array

  const submitFeedback = async () => {
    try {
      await api.post(`/guest-services/${selectedRequest._id}/feedback`, feedback);
      enqueueSnackbar('Thank you for your feedback!', { variant: 'success' });
      setFeedback({ rating: 5, comment: '' });
      setShowFeedbackModal(false);
      fetchMyRequests();
    } catch (error) {
      enqueueSnackbar('Failed to submit feedback', { variant: 'error' });
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

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return 'Your request is waiting to be assigned to staff';
      case 'assigned': return 'A staff member has been assigned to help you';
      case 'in_progress': return 'Your request is currently being worked on';
      case 'completed': return 'Your request has been completed';
      case 'cancelled': return 'Your request has been cancelled';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Service Requests</h1>
            <p className="text-gray-600">Track the status of your service requests</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchMyRequests} color="gray">
              <span className="mr-2">↻</span>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="mx-auto h-12 w-12 bg-gray-400 rounded-full flex items-center justify-center text-white text-xl">💬</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No service requests</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't submitted any service requests yet.</p>
          <div className="mt-6">
            <Button href="/guest/services">Submit a Request</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                    <Badge
                      color={statusColors[request.status]}
                      className="inline-flex items-center"
                    >
                      {getStatusIcon(request.status)}
                      {request.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                    {request.attachments && request.attachments.length > 0 && (
                      <span className="text-gray-400" title="Has attachments">📎</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{request.description}</p>

                  <div className="text-sm text-gray-500 mb-3">
                    {getStatusMessage(request.status)}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Submitted {moment(request.createdAt).fromNow()}</span>
                    {request.room && <span>Room {request.room.number}</span>}
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailsModal(true);
                    }}
                  >
                    View Details
                    {request.attachments && request.attachments.length > 0 && (
                      <span className="ml-1 inline text-xs">📎</span>
                    )}
                  </Button>

                  {request.status === 'completed' && !request.feedback && (
                    <Button
                      size="sm"
                      color="blue"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowFeedbackModal(true);
                      }}
                    >
                      Leave Feedback
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Request Details Modal */}
          <Modal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title={`Request Details: ${selectedRequest?.title || 'Loading...'}`}
            size="xl"
          >
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-gray-700">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      <Badge
                        color={statusColors[selectedRequest.status]}
                        className="inline-flex items-center"
                      >
                        {getStatusIcon(selectedRequest.status)}
                        {selectedRequest.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Room</Label>
                    <p className="mt-1 text-gray-700">{selectedRequest.room?.number || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Submitted</Label>
                    <p className="mt-1 text-gray-700">{moment(selectedRequest.createdAt).format('MMM D, YYYY h:mm A')}</p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="mt-1 text-gray-700">{moment(selectedRequest.updatedAt).format('MMM D, YYYY h:mm A')}</p>
                  </div>
                </div>

                {selectedRequest.specialInstructions && (
                  <div>
                    <Label>Special Instructions</Label>
                    <p className="mt-1 text-gray-700">{selectedRequest.specialInstructions}</p>
                  </div>
                )}

                {selectedRequest.notes && selectedRequest.notes.length > 0 && (
                  <div>
                    <Label>Staff Notes</Label>
                    <div className="mt-2 space-y-2">
                      {selectedRequest.notes.map((note, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {moment(note.addedAt).fromNow()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div>
                    <Label>Attachments</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {selectedRequest.attachments.map((file, index) => (
                        <div key={index} className="border rounded-md p-2">
                          {file.url && file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img src={file.url} alt={file.filename} className="h-24 w-full object-cover" />
                          ) : (
                            <div className="h-24 flex items-center justify-center bg-gray-100">
                              <span className="text-sm text-gray-500">{file.filename}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.feedback && (
                  <div>
                    <Label>Your Feedback</Label>
                    <div className="mt-2 bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center space-x-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < selectedRequest.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      {selectedRequest.feedback.comment && (
                        <p className="text-sm text-gray-700">{selectedRequest.feedback.comment}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    variant="secondary"
                  >
                    Close
                  </Button>

                  {selectedRequest.status === 'completed' && !selectedRequest.feedback && (
                    <Button
                      onClick={() => {
                        setShowFeedbackModal(true);
                        setShowDetailsModal(false);
                      }}
                      variant="primary"
                    >
                      Leave Feedback
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Modal>

          {/* Feedback Modal */}
          <Modal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            title={`Leave Feedback for "${selectedRequest?.title || 'Request'}"`}
            size="md"
          >
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex items-center space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`text-2xl ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                      onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Comments (Optional)</Label>
                <Textarea
                  rows={3}
                  value={feedback.comment}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us about your experience..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  onClick={() => setShowFeedbackModal(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button onClick={submitFeedback} variant="primary">
                  Submit Feedback
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default GuestServiceRequestsPage;