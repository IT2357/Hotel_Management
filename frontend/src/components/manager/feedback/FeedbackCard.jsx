import { motion } from "framer-motion";
import { 
  Calendar, Users, Star, ThumbsUp, Reply, CheckCircle, 
  Archive 
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDate, getStatusBadge, getSentimentConfig } from "@/utils/feedbackUtils";

/**
 * Individual feedback card component
 * Supports both guest feedback and food reviews
 */
const FeedbackCard = ({ 
  entry, 
  type = 'guest', // 'guest' | 'food'
  onMarkHelpful, 
  onRespond, 
  onPublish, 
  onArchive 
}) => {
  const badge = getStatusBadge(entry.status);
  const sentiment = getSentimentConfig(entry.sentiment);
  
  // Adapt display data based on type
  const displayData = type === 'food' ? {
    title: entry.orderDetails || 'Food Order',
    subtitle: entry.tableNumber && entry.tableNumber !== '-' 
      ? `Table ${entry.tableNumber}` 
      : entry.orderType,
    name: entry.customerName,
    date: entry.orderDate
  } : {
    title: entry.roomTitle,
    subtitle: `Room ${entry.roomNumber}`,
    name: entry.guestName,
    date: entry.stayDate
  };
  
  return (
    <motion.div
      key={entry._id || entry.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Header Section with subtle background */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b-2 border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 className="text-lg font-black text-gray-900">
                  {displayData.title} · {displayData.subtitle}
                </h2>
                <Badge
                  variant={badge.variant}
                  className={`px-2.5 py-1 font-bold text-xs uppercase tracking-wider rounded-lg ${
                    badge.variant === 'success'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {badge.label}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                    sentiment.color === 'green' 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : sentiment.color === 'red'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {sentiment.icon} {sentiment.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="h-4 w-4 text-gray-500" />
                  {displayData.name}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {formatDate(displayData.date)}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ThumbsUp className="h-4 w-4 text-gray-500" />
                  {entry.helpful || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${index < entry.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="mb-5 space-y-2">
            <h3 className="text-lg font-bold text-gray-900">{entry.title}</h3>
            <p className="leading-relaxed text-gray-700 text-sm font-medium">{entry.comment}</p>
          </div>

          {(entry.highlights?.length > 0 || entry.concerns?.length > 0) && (
            <div className="mb-5 grid gap-4 lg:grid-cols-2">
              {entry.highlights?.length > 0 && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
                  <h4 className="text-sm font-black text-emerald-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <span className="text-lg">✨</span>
                    HIGHLIGHTS
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {entry.highlights.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 font-medium">
                        <span className="text-emerald-600 font-black mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {entry.concerns?.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                  <h4 className="text-sm font-black text-red-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <span className="text-lg">⚠️</span>
                    NEEDS ATTENTION
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {entry.concerns.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 font-medium">
                        <span className="text-red-600 font-black mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t-2 border-gray-200 pt-5">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={() => onMarkHelpful(entry._id || entry.id)}
                className="border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 font-bold shadow-sm transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </button>
            </motion.div>
            {entry.status === "pending" && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={() => onRespond(entry)}
                    className="border-2 border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100 font-bold shadow-sm transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Reply className="h-4 w-4" />
                    Respond
                  </button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={() => onPublish(entry)}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 font-bold shadow-md transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Publish
                  </button>
                </motion.div>
              </>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                className="border-2 border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100 font-bold shadow-sm transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
                onClick={() => onArchive(entry)}
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
            </motion.div>
          </div>

          {entry.response?.hasResponse && (
            <div className="mt-5 border-2 border-emerald-200 bg-emerald-50 p-5 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-emerald-700 text-sm">
                    Response from {entry.response.respondedBy}
                  </span>
                  <span className="text-gray-600 text-xs ml-2 font-medium">
                    • {formatDate(entry.response.respondedAt)}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 pl-8 text-sm leading-relaxed font-medium">
                {entry.response.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FeedbackCard;
