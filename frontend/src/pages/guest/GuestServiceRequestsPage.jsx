import React, { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, Clock, User, CheckCircle, X, AlertCircle, Star, FileText, Calendar, MapPin, Image as ImageIcon } from 'lucide-react';
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

const socket = io( import.meta.env.VITE_API_BASE_URL);
// Badge variants for statuses and priorities
const statusVariants = {
  pending: 'warning',
  assigned: 'info',
  in_progress: 'secondary',
  completed: 'success',
  cancelled: 'danger'
};

const priorityVariants = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  urgent: 'danger'
};

const requestTypeLabels = {
  room_service: 'Room Service',
  housekeeping: 'Housekeeping',
  concierge: 'Concierge',
  transport: 'Transport',
  maintenance: 'Maintenance',
  laundry: 'Laundry',
  wakeup_call: 'Wake-up Call',
  dining: 'Dining',
  spa: 'Spa',
  other: 'Other'
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your service requests...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              My Service Requests
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track and manage all your service requests in one place
          </p>
        </motion.div>

        <div className="flex justify-end mb-6">
          <button
            onClick={fetchMyRequests}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

      {requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-16 bg-white rounded-2xl shadow-2xl"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl shadow-lg mb-4">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No service requests</h3>
          <p className="text-lg text-gray-600 mb-6">You haven't submitted any service requests yet.</p>
          <button
            onClick={() => window.location.href = '/guest/services'}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <MessageSquare className="w-5 h-5" />
            Submit a Request
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {requests.map((request, index) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{request.title}</h3>
                    <Badge
                      variant={statusVariants[request.status]}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                    >
                      {getStatusIcon(request.status)}
                      {request.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                    {request.priority && (
                      <Badge variant={priorityVariants[request.priority]} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold">
                        🔥 {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </Badge>
                    )}
                    {request.requestType && (
                      <Badge variant="secondary" className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold">
                        🧩 {requestTypeLabels[request.requestType] || request.requestType}
                      </Badge>
                    )}
                    {request.attachments && request.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm" title="Has attachments">
                        <ImageIcon className="w-4 h-4" />
                        {request.attachments.length}
                      </span>
                    )}
                  </div>

                  <p className="text-base text-gray-600 mb-4">{request.description}</p>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl mb-4">
                    <p className="text-sm text-indigo-800 font-medium">
                      {getStatusMessage(request.status)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Submitted {moment(request.createdAt).fromNow()}</span>
                    </div>
                    {request.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span>Room {request.room.roomNumber}</span>
                      </div>
                    )}
                    {request.estimatedCompletionTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span>ETA {moment(request.estimatedCompletionTime).fromNow()}</span>
                      </div>
                    )}
                    {request.assignedTo && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span>Assigned to {request.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex lg:flex-col gap-3">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailsModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    View Details
                    {request.attachments && request.attachments.length > 0 && (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </button>

                  {request.status === 'completed' && !request.feedback && (
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowFeedbackModal(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <Star className="w-5 h-5" />
                      Leave Feedback
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
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
                        variant={statusVariants[selectedRequest.status]}
                        className="inline-flex items-center"
                      >
                        {getStatusIcon(selectedRequest.status)}
                        {selectedRequest.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Room</Label>
                    <p className="mt-1 text-gray-700">{selectedRequest.room?.roomNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <div className="mt-1">
                      <Badge variant={priorityVariants[selectedRequest.priority]} className="inline-flex items-center">
                        🔥 {selectedRequest.priority?.charAt(0).toUpperCase() + selectedRequest.priority?.slice(1) || 'Medium'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <p className="mt-1 text-gray-700">{requestTypeLabels[selectedRequest.requestType] || selectedRequest.requestType}</p>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assigned To</Label>
                    <p className="mt-1 text-gray-700">{selectedRequest.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <Label>Estimated Completion</Label>
                    <p className="mt-1 text-gray-700">{selectedRequest.estimatedCompletionTime ? moment(selectedRequest.estimatedCompletionTime).format('MMM D, YYYY h:mm A') : 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label>Timeline</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-gray-500">Created</div>
                      <div className="font-medium">{moment(selectedRequest.createdAt).format('MMM D, YYYY h:mm A')}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-gray-500">Assigned</div>
                      <div className="font-medium">{selectedRequest.assignedAt ? moment(selectedRequest.assignedAt).format('MMM D, YYYY h:mm A') : '—'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-gray-500">Completed</div>
                      <div className="font-medium">{selectedRequest.completedAt ? moment(selectedRequest.completedAt).format('MMM D, YYYY h:mm A') : '—'}</div>
                    </div>
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
                          {note.addedBy && (
                            <p className="text-xs text-gray-600 mt-1">By {note.addedBy.name}</p>
                          )}
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

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300"
                  >
                    <X className="w-5 h-5" />
                    Close
                  </button>

                  {selectedRequest.status === 'completed' && !selectedRequest.feedback && (
                    <button
                      onClick={() => {
                        setShowFeedbackModal(true);
                        setShowDetailsModal(false);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Star className="w-5 h-5" />
                      Leave Feedback
                    </button>
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

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button 
                  onClick={submitFeedback}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <CheckCircle className="w-5 h-5" />
                  Submit Feedback
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
      </div>
    </div>
  );
};

export default GuestServiceRequestsPage;