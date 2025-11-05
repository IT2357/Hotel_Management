import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageCircle, User, Clock, CheckCheck, Check, Circle, 
  AlertCircle, Loader2, Phone, Video, MoreVertical, Search,
  ArrowLeft, Paperclip, Smile, X, Image as ImageIcon, Mic,
  Menu, Settings, LogOut, Bell, Users, ChevronLeft
} from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useSnackbar } from 'notistack';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const StaffContactChat = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    if (!currentUser?._id) return;

    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsOnline(true);
      newSocket.emit('join-role-room', {
        role: currentUser.role,
        userId: currentUser._id
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsOnline(false);
    });

    newSocket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      setMessages(prev => [...prev, data.message]);
      playNotificationSound();
    });

    newSocket.on('typing', (data) => {
      if (data.userId !== currentUser._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    newSocket.on('message_read', (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId ? { ...msg, readBy: [...(msg.readBy || []), data.userId] } : msg
      ));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Fetch managers and conversation on mount
  useEffect(() => {
    if (currentUser?._id) {
      fetchManagers();
      fetchUnreadCount();
    }
  }, [currentUser]);

  // Fetch conversation when manager is selected
  useEffect(() => {
    if (selectedManager) {
      fetchConversation();
    }
  }, [selectedManager]);

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/staff/messaging/managers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setManagers(data.data);
          setSelectedManager(data.data[0]); // Auto-select first manager
        }
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/staff/messaging/conversation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
        markMessagesAsRead();
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      enqueueSnackbar('Failed to load messages', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/staff/messaging/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/staff/messaging/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/staff/messaging/send-to-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          subject: 'Staff Message',
          priority: 'normal'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data]);
        
        if (socket) {
          socket.emit('send_message', {
            message: data.data,
            recipientId: selectedManager?._id
          });
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      enqueueSnackbar('Failed to send message', { variant: 'error' });
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (socket && selectedManager) {
      socket.emit('typing', {
        userId: currentUser._id,
        recipientId: selectedManager._id
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('stop_typing', {
          userId: currentUser._id,
          recipientId: selectedManager?._id
        });
      }
    }, 1000);
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const formatMessageTime = (date) => {
    if (isToday(new Date(date))) {
      return format(new Date(date), 'h:mm a');
    } else if (isYesterday(new Date(date))) {
      return `Yesterday ${format(new Date(date), 'h:mm a')}`;
    } else {
      return format(new Date(date), 'MMM d, h:mm a');
    }
  };

  const formatDateDivider = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) return 'Today';
    if (isYesterday(messageDate)) return 'Yesterday';
    return format(messageDate, 'MMMM d, yyyy');
  };

  const shouldShowDateDivider = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);
    return !isSameDay(currentDate, previousDate);
  };

  const isMessageFromCurrentUser = (msg) => {
    return msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id;
  };

  const getMessageStatus = (msg) => {
    if (!isMessageFromCurrentUser(msg)) return null;
    
    if (msg.readBy && msg.readBy.length > 1) {
      return <CheckCheck className="w-4 h-4 text-green-500" />;
    } else if (msg.readBy && msg.readBy.length > 0) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '👏', '🙏', '😍', '🤔', '😎', '💪', '🌟'];

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const filteredManagers = managers.filter(manager =>
    manager.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !selectedManager) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* WhatsApp-style Header */}
      <div className="bg-green-600 text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button className="lg:hidden">
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 font-semibold">
                {manager?.name?.[0]?.toUpperCase() || 'M'}
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-base">{manager?.name || 'Manager'}</h2>
              <p className="text-xs text-green-100">
                {isTyping ? 'typing...' : isOnline ? 'online' : 'offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="hover:bg-green-700 p-2 rounded-full transition">
              <Video className="w-5 h-5" />
            </button>
            <button className="hover:bg-green-700 p-2 rounded-full transition">
              <Phone className="w-5 h-5" />
            </button>
            <button className="hover:bg-green-700 p-2 rounded-full transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4dce0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-gray-500"
            >
              <MessageCircle className="w-20 h-20 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <React.Fragment key={msg._id || index}>
                {/* Date Divider */}
                {shouldShowDateDivider(msg, messages[index - 1]) && (
                  <div className="flex justify-center my-4">
                    <div className="bg-white px-3 py-1 rounded-md shadow-sm text-xs text-gray-600">
                      {formatDateDivider(msg.createdAt)}
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMessageFromCurrentUser(msg) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 shadow ${
                      isMessageFromCurrentUser(msg)
                        ? 'bg-green-500 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {msg.subject && msg.subject !== 'Staff Message' && (
                      <p className={`text-xs font-semibold mb-1 ${isMessageFromCurrentUser(msg) ? 'text-green-100' : 'text-gray-500'}`}>
                        {msg.subject}
                      </p>
                    )}
                    
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                    
                    <div className={`flex items-center justify-end space-x-1 mt-1 ${
                      isMessageFromCurrentUser(msg) ? 'text-white' : 'text-gray-500'
                    }`}>
                      <span className="text-xs opacity-75">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      {getMessageStatus(msg)}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            ))
          )}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-lg rounded-bl-none px-4 py-3 shadow">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border-t border-gray-200 p-4"
          >
            <div className="flex flex-wrap gap-2">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-100 p-2 rounded transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 transition"
          >
            <Smile className="w-6 h-6" />
          </button>

          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 transition"
          >
            <Paperclip className="w-6 h-6" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message"
              className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-green-500 transition"
              disabled={sending}
            />
          </div>

          {newMessage.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="p-3 text-gray-500 hover:text-gray-700 transition"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default StaffContactChat;
