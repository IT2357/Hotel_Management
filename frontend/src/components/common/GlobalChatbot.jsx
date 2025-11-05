import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, HelpCircle } from 'lucide-react';

const GlobalChatbot = () => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm here to help. You can ask me about your bookings, hotel services, or anything else!", sender: 'bot' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickQuestions = [
    "Show my upcoming bookings",
    "How do I cancel a booking?", 
    "What amenities do you offer?",
    "Room service hours?",
    "Check-in/check-out times?"
  ];

  const handleSendMessage = (text = inputMessage) => {
    if (!text.trim()) return;
    
    const userMessage = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = { 
        id: Date.now() + 1, 
        text: getBotResponse(text), 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
    
    setInputMessage('');
  };

  const getBotResponse = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('booking') || msg.includes('reservation')) {
      return "You can view all your bookings in your profile under 'My Bookings' tab. Would you like me to guide you there?";
    }
    if (msg.includes('cancel')) {
      return "To cancel a booking, go to 'My Bookings' in your profile and click on the booking you want to cancel. You'll see a cancel option there.";
    }
    if (msg.includes('amenities')) {
      return "We offer: Free WiFi, Pool, Gym, Spa, Restaurant, Room Service, Concierge, Parking, and more! What specific amenity are you interested in?";
    }
    if (msg.includes('room service')) {
      return "Room service is available 24/7! You can order through the Food Menu or call extension 101 from your room.";
    }
    if (msg.includes('check')) {
      return "Check-in: 3:00 PM | Check-out: 11:00 AM. Early check-in and late check-out may be available upon request.";
    }
    if (msg.includes('wifi') || msg.includes('internet')) {
      return "Free high-speed WiFi is available throughout the hotel. Network name: 'Hotel_Guest' - No password required!";
    }
    if (msg.includes('pool') || msg.includes('swimming')) {
      return "Our pool is open daily from 6:00 AM to 10:00 PM. Pool towels are provided, and lifeguard is on duty during peak hours.";
    }
    if (msg.includes('spa') || msg.includes('massage')) {
      return "Our spa offers various treatments and massages. Hours: 9:00 AM - 8:00 PM. Book through guest services or call extension 102.";
    }
    if (msg.includes('restaurant') || msg.includes('dining')) {
      return "Main restaurant hours: Breakfast 6-10 AM, Lunch 12-3 PM, Dinner 6-10 PM. Room service available 24/7!";
    }
    if (msg.includes('gym') || msg.includes('fitness')) {
      return "Our fitness center is open 24/7 for hotel guests. Located on the 2nd floor with modern equipment and complimentary towels.";
    }
    if (msg.includes('parking')) {
      return "Complimentary self-parking available. Valet parking also offered for $25/night. EV charging stations available.";
    }
    if (msg.includes('laundry')) {
      return "Laundry service available! Drop off before 10 AM for same-day return. Self-service laundry room on the 3rd floor.";
    }
    if (msg.includes('help') || msg.includes('support')) {
      return "I'm here to help! You can also reach our 24/7 front desk at (555) 123-4567 or guest services at extension 100.";
    }
    return "Thanks for your question! For specific inquiries, please contact our front desk at (555) 123-4567 or visit guest services. Is there anything else I can help you with?";
  };

  return (
    <>
      {/* Chatbot Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setChatbotOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all duration-300 hover:shadow-xl ${
          chatbotOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ zIndex: 40 }}
      >
        <MessageSquare className="w-6 h-6" />
        {/* Notification dot */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs animate-pulse">
          ?
        </span>
      </motion.button>

      {/* Chatbot Window */}
      <AnimatePresence>
        {chatbotOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ zIndex: 50 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Hotel Assistant</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-xs opacity-90">Online now</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatbotOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* Typing indicator */}
              {messages.length > 1 && messages[messages.length - 1].sender === 'user' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white p-3 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Questions */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex flex-wrap gap-2 mb-3">
                {quickQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="text-xs px-3 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-gray-200"
                  >
                    {question}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalChatbot;