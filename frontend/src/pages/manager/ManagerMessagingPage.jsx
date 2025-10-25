import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  MessageCircle, 
  Users, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Mail,
  User,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { ManagerLayout } from '@/components/manager';

export default function ManagerMessagingPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    recipient: '',
    messageType: 'announcement',
    priority: 'medium',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    fetchMessages();
    fetchStaffList();
  }, []);

  const handleMenuItemSelect = useCallback((item) => {
    // Allow all navigation - don't block anything
    return undefined;
  }, []);

  const fetchStaffList = async () => {
    setLoadingStaff(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/manager/messaging/staff-list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch staff list');
      }

      const data = await response.json();
      console.log('Staff list data:', data); // Debug log
      
      // Combine teams and individuals
      const allRecipients = [
        ...data.data.teams,
        { id: 'divider', name: '──────────', disabled: true },
        ...data.data.individuals.map(staff => ({
          ...staff,
          type: 'individual'
        }))
      ];
      
      console.log('All recipients:', allRecipients); // Debug log
      setStaffList(allRecipients);
      
      if (data.data.individuals.length === 0) {
        toast.info('No Staff Members Found', {
          description: 'There are no active staff members in the system'
        });
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to Load Staff', {
        description: error.message || 'Could not fetch staff list'
      });
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchMessages = async () => {
    try {
      console.log('🔄 Fetching messages...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No auth token found');
        toast.error('Authentication Error', {
          description: 'Please log in again'
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/manager/messaging/sent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch messages');
      }

      const data = await response.json();
      console.log('📨 Received data:', data);
      console.log(`✅ Got ${data.count} messages from server`);
      
      // Map Message model fields to frontend format
      const typeMap = {
        'general': 'announcement',
        'schedule': 'task',
        'emergency': 'alert',
        'request': 'feedback',
        'complaint': 'feedback'
      };
      
      const mappedMessages = data.data.map(msg => {
        const mapped = {
          id: msg._id,
          subject: msg.subject,
          message: msg.message,
          recipient: msg.recipient?.name || msg.recipientSummary || 'Unknown',
          type: typeMap[msg.type] || 'general',
          priority: msg.priority,
          timestamp: msg.createdAt,
          status: msg.status,
          isBroadcast: msg.isBroadcast || false,
          recipientCount: msg.recipientCount || 1
        };
        console.log('Mapped message:', mapped);
        return mapped;
      });
      
      console.log(`✅ Setting ${mappedMessages.length} messages in state`);
      setMessages(mappedMessages);
      
      if (mappedMessages.length === 0) {
        toast.info('No Messages Yet', {
          description: 'Send your first message using the form above'
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      toast.error('Failed to Load Messages', {
        description: error.message || 'Could not fetch message history'
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Missing Information', {
        description: 'Please provide both subject and message'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Determine recipient type
      const selectedStaff = staffList.find(s => s.value === formData.recipient);
      let recipientType = 'individual';
      
      if (formData.recipient === 'all') {
        recipientType = 'all';
      } else if (selectedStaff && selectedStaff.type === 'department') {
        recipientType = 'department';
      } else if (selectedStaff && selectedStaff.type === 'team') {
        recipientType = 'all';
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/manager/messaging/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: formData.recipient,
          recipientType,
          subject: formData.subject,
          message: formData.message,
          messageType: formData.messageType,
          priority: formData.priority
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      
      // Refresh messages list
      await fetchMessages();
      
      // Reset form
      setFormData({
        recipient: '',
        messageType: 'announcement',
        priority: 'medium',
        subject: '',
        message: ''
      });

      toast.success('Message Sent!', {
        description: 'Your message has been delivered successfully'
      });
    } catch (error) {
      toast.error('Failed to Send', {
        description: error.message || 'Could not send message'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'from-red-500 to-rose-500';
      case 'medium':
        return 'from-amber-500 to-orange-500';
      case 'low':
        return 'from-emerald-500 to-green-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement':
        return '📢';
      case 'task':
        return '📋';
      case 'alert':
        return '🚨';
      case 'feedback':
        return '💬';
      default:
        return '📧';
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || msg.type === filter;
    const matchesSearch = msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <ManagerLayout activeItem="messaging" onMenuItemSelect={handleMenuItemSelect}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Staff Messaging</h1>
                <p className="text-gray-600 font-medium mt-1">Communicate with your team effectively</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-3 rounded-xl border-2 border-emerald-200">
              <Users className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-gray-900">
                {loadingStaff ? 'Loading...' : `${staffList.filter(s => s.type === 'individual').length} Staff Members`}
              </span>
            </div>
          </div>
        </div>

        {/* Compose Message Section */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-indigo-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Compose Message</h2>
                <p className="text-gray-600 font-medium">Send messages to your staff</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="p-8 space-y-6">
            {/* Recipient and Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-600" />
                  Recipient *
                </label>
                <select
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  required
                  disabled={loadingStaff}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 bg-white rounded-xl text-gray-900 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{loadingStaff ? 'Loading staff...' : 'Select recipient...'}</option>
                  {staffList.map(staff => {
                    if (staff.disabled) {
                      return <option key={staff.id} disabled className="text-gray-400">{staff.name}</option>;
                    }
                    const prefix = staff.type === 'individual' ? '👤 ' : 
                                  staff.type === 'department' ? '👥 ' : 
                                  staff.type === 'team' ? '📢 ' : '';
                    return <option key={staff.id} value={staff.value}>{prefix}{staff.name}</option>;
                  })}
                  {!loadingStaff && staffList.length === 0 && (
                    <option disabled>No staff members available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                  Message Type *
                </label>
                <select
                  value={formData.messageType}
                  onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 bg-white rounded-xl text-gray-900 font-medium focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                >
                  <option value="announcement">📢 Announcement</option>
                  <option value="task">📋 Task Assignment</option>
                  <option value="alert">🚨 Alert</option>
                  <option value="feedback">💬 Feedback</option>
                </select>
              </div>
            </div>

            {/* Priority and Subject Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 bg-white rounded-xl text-gray-900 font-medium focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Enter message subject..."
                  className="w-full px-4 py-3.5 border-2 border-gray-300 bg-white rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-indigo-600" />
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                placeholder="Type your message here... Be clear and specific."
                className="w-full px-4 py-3.5 border-2 border-gray-300 bg-white rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
              />
              <div className="text-xs text-gray-500 mt-2 font-medium">
                {formData.message.length}/1000 characters
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Message History */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Message History</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-gray-600 font-medium">{messages.length} messages sent</p>
                  </div>
                </div>
              </div>

              {/* Filter & Search */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border-2 border-gray-300 bg-white rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="all">All Types</option>
                  <option value="announcement">Announcements</option>
                  <option value="task">Tasks</option>
                  <option value="alert">Alerts</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-10 w-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No messages match your search' : 'Send your first message using the form above'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className="p-6 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                          <span className="text-2xl">{getTypeIcon(msg.type)}</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">{msg.subject}</h4>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${getPriorityColor(msg.priority)} text-white shadow-md`}>
                              {msg.priority.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                              To: {msg.recipient || 'All Staff'}
                              {msg.isBroadcast && msg.recipientCount > 1 && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                  {msg.recipientCount} recipients
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">
                          {new Date(msg.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 ml-16 bg-gray-50 p-4 rounded-xl border-l-4 border-indigo-500">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </ManagerLayout>
  );
}
