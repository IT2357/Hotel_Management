import React, { useState, useEffect } from 'react';
import { feedbackAPI, formatters } from '../../services/taskManagementAPI';

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyForm, setReplyForm] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchFeedbacks();
    fetchUnreadCount();
  }, [activeTab]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackAPI.getMyFeedback({
        type: activeTab,
        limit: 50
      });
      setFeedbacks(response.data.feedback);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await feedbackAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (feedbackId) => {
    try {
      await feedbackAPI.markFeedbackAsRead(feedbackId);
      // Update local state
      setFeedbacks(prev => 
        prev.map(f => 
          f._id === feedbackId ? { ...f, isRead: true, readAt: new Date() } : f
        )
      );
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const handleReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyForm({
      subject: `Re: ${feedback.subject}`,
      message: '',
      priority: 'medium'
    });
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!selectedFeedback || !replyForm.subject || !replyForm.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await feedbackAPI.replyToFeedback(selectedFeedback._id, replyForm);
      
      // Reset form and close modal
      setReplyForm({ subject: '', message: '', priority: 'medium' });
      setShowReplyModal(false);
      setSelectedFeedback(null);
      
      // Refresh feedbacks
      fetchFeedbacks();
      
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  const getFeedbackTypeIcon = (feedbackType) => {
    const icons = {
      'manager-to-staff': '👨‍💼',
      'staff-to-manager': '👨‍🔧',
      'guest-to-staff': '🏨',
      'staff-to-guest': '🛎️',
      'manager-to-guest': '👨‍💼'
    };
    return icons[feedbackType] || '💬';
  };

  const getFeedbackTypeLabel = (feedbackType) => {
    const labels = {
      'manager-to-staff': 'From Manager',
      'staff-to-manager': 'To Manager',
      'guest-to-staff': 'From Guest',
      'staff-to-guest': 'To Guest',
      'manager-to-guest': 'Manager to Guest'
    };
    return labels[feedbackType] || feedbackType;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
            <p className="text-gray-600 mt-2">Manage feedback and communications</p>
          </div>
          
          {unreadCount > 0 && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <div className="flex items-center text-red-700">
                <span className="text-lg mr-2">🔔</span>
                <span className="font-medium">{unreadCount} unread feedback</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Received
            {unreadCount > 0 && activeTab !== 'received' && (
              <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedbacks.length > 0 ? (
            feedbacks.map((feedback) => (
              <div
                key={feedback._id}
                className={`bg-white rounded-lg shadow-md p-6 transition-colors ${
                  activeTab === 'received' && !feedback.isRead ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getFeedbackTypeIcon(feedback.feedbackType)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{feedback.subject}</h3>
                      {activeTab === 'received' && !feedback.isRead && (
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          NEW
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                        {feedback.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{getFeedbackTypeLabel(feedback.feedbackType)}</span>
                      <span>
                        {activeTab === 'received' ? `From: ${feedback.fromUser.name}` : `To: ${feedback.toUser.name}`}
                      </span>
                      <span>Task: {feedback.taskId.title}</span>
                      <span>{formatters.formatRelativeTime(feedback.createdAt)}</span>
                      {feedback.isRead && feedback.readAt && (
                        <span className="text-green-600">✓ Read</span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-4">{feedback.message}</p>
                    
                    {feedback.rating && (
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-sm font-medium text-gray-700">Rating:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < feedback.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({feedback.rating}/5)</span>
                      </div>
                    )}
                    
                    {feedback.hasResponse && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">💬</span>
                          <span>This feedback has been replied to</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {activeTab === 'received' && !feedback.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(feedback._id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Mark as Read
                      </button>
                    )}
                    
                    {activeTab === 'received' && !feedback.hasResponse && (
                      <button
                        onClick={() => handleReply(feedback)}
                        className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                      >
                        Reply
                      </button>
                    )}
                    
                    <button
                      onClick={() => window.open(`/manager/tasks/${feedback.taskId._id}`, '_blank')}
                      className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                    >
                      View Task
                    </button>
                  </div>
                </div>
                
                {/* Attachments */}
                {feedback.attachments && feedback.attachments.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Attachments:</div>
                    <div className="flex flex-wrap gap-2">
                      {feedback.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Attachment {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No {activeTab} feedback
              </h3>
              <p className="text-gray-600">
                {activeTab === 'received' 
                  ? "You don't have any received feedback yet."
                  : "You haven't sent any feedback yet."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Reply to Feedback</h3>
                  <p className="text-gray-600 mt-1">Replying to: {selectedFeedback.subject}</p>
                </div>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Original Message */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Original Message:</div>
                <div className="text-sm text-gray-600">{selectedFeedback.message}</div>
              </div>
              
              {/* Reply Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={replyForm.subject}
                  onChange={(e) => setReplyForm({ ...replyForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={replyForm.message}
                  onChange={(e) => setReplyForm({ ...replyForm, message: e.target.value })}
                  placeholder="Enter your reply..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={replyForm.priority}
                  onChange={(e) => setReplyForm({ ...replyForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
