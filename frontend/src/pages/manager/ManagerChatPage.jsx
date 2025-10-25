import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  MessageCircle, 
  Users, 
  Search,
  Clock,
  CheckCheck,
  User,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { ManagerLayout } from '@/components/manager';

export default function ManagerChatPage() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchConversation(selectedStaff.id);
      // Auto-refresh every 5 seconds
      const interval = setInterval(() => {
        fetchConversation(selectedStaff.id, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedStaff]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMenuItemSelect = useCallback((item) => {
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
        throw new Error('Failed to fetch staff list');
      }

      const data = await response.json();
      setStaffList(data.data.individuals || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to Load Staff', {
        description: error.message
      });
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchConversation = async (staffId, silent = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/manager/messaging/conversation/${staffId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }

      const data = await response.json();
      setMessages(data.data || []);
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch conversation:', error);
        toast.error('Failed to Load Chat', {
          description: error.message
        });
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedStaff) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/manager/messaging/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: selectedStaff.id,
          message: newMessage,
          conversationId: `${currentUserId}_${selectedStaff.id}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to Send', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredStaff = staffList.filter(staff =>
    staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ManagerLayout activeItem="chat" onMenuItemSelect={handleMenuItemSelect}>
      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
        
        {/* Page Header */}
        <div className="bg-white rounded-t-2xl shadow-xl border-2 border-b-0 border-indigo-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Chat</h1>
                <p className="text-gray-600 font-medium">WhatsApp-style messaging</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-3 rounded-xl border-2 border-emerald-200">
              <Users className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-gray-900">{staffList.length} Staff Online</span>
            </div>
          </div>
        </div>

        {/* Chat Container - WhatsApp Style */}
        <div className="bg-white shadow-xl border-2 border-t-0 border-indigo-100 rounded-b-2xl overflow-hidden flex h-[calc(100vh-250px)]">
          
          {/* Left Sidebar - Staff List */}
          <div className="w-1/3 border-r-2 border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b-2 border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search staff..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 bg-gray-50 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto">
              {loadingStaff ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading staff...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">No staff found</p>
                </div>
              ) : (
                filteredStaff.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-indigo-50 ${
                      selectedStaff?.id === staff.id ? 'bg-indigo-100 border-l-4 border-l-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold shadow-lg">
                        {staff.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{staff.name}</h4>
                        <p className="text-sm text-gray-500">{staff.department}</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedStaff ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedStaff(null)}
                      className="lg:hidden p-2 hover:bg-white rounded-lg transition-all"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {selectedStaff.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedStaff.name}</h3>
                      <p className="text-sm text-gray-600">{selectedStaff.department}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-indigo-50/30">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, index) => {
                        const isSent = msg.sender?._id === currentUserId || msg.sender === currentUserId;
                        return (
                          <div
                            key={msg._id || index}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-md ${
                                isSent
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
                                  : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                              }`}
                            >
                              <p className="text-sm break-words">{msg.message}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-xs ${isSent ? 'text-indigo-100' : 'text-gray-500'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isSent && <CheckCheck className="h-3 w-3 text-indigo-100" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={loading}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-full text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={loading || !newMessage.trim()}
                      className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50/30">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-10 w-10 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Staff Member</h3>
                  <p className="text-gray-600">Choose someone from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </ManagerLayout>
  );
}
