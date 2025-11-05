import { AnimatePresence, motion } from "framer-motion";
import { X, Reply, Star, Send } from "lucide-react";

/**
 * Modal for responding to guest feedback
 */
const FeedbackResponseModal = ({
  isOpen,
  selectedFeedback,
  responseText,
  setResponseText,
  onSendResponse,
  onClose
}) => {
  if (!isOpen || !selectedFeedback) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-gray-900">
                Respond to {selectedFeedback.guestName}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300 group"
              >
                <X className="h-6 w-6 text-gray-600 group-hover:text-gray-900" />
              </motion.button>
            </div>

            {/* Guest Feedback Preview */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-black text-gray-900">{selectedFeedback.rating}</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < selectedFeedback.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm font-bold text-gray-600">
                  {selectedFeedback.roomTitle}
                </span>
              </div>
              <p className="text-gray-700 text-base leading-relaxed font-medium">
                "{selectedFeedback.comment}"
              </p>
            </div>
          </div>
          
          {/* Response Form */}
          <div className="p-8">
            <label className="block text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
              <Reply className="h-5 w-5 text-indigo-600" />
              Your Response
            </label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response here..."
              rows={8}
              className="w-full px-6 py-5 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all duration-300 shadow-sm text-base font-medium"
            />
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={onClose}
                  className="border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold shadow-sm transition-all duration-300"
                >
                  Cancel
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={onSendResponse}
                  disabled={!responseText.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  Send Response
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackResponseModal;
