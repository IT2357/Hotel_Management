import { motion } from "framer-motion";
import { MessageCircle, Star } from "lucide-react";
import { getRatingColorScheme } from "@/utils/feedbackUtils";

/**
 * Analytics section showing sentiment and rating distribution
 */
const FeedbackAnalytics = ({ sentimentStats, ratingDistribution, feedbackCount }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sentiment Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
      >
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          Sentiment Analysis
        </h3>
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">😊</span>
              <span className="text-emerald-700 font-bold text-lg">Positive</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-black text-2xl">{sentimentStats.positive.count}</p>
              <p className="text-sm text-emerald-600 font-bold">{sentimentStats.positive.percent}%</p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border-2 border-amber-200 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">😐</span>
              <span className="text-amber-700 font-bold text-lg">Neutral</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-black text-2xl">{sentimentStats.neutral.count}</p>
              <p className="text-sm text-amber-600 font-bold">{sentimentStats.neutral.percent}%</p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 rounded-xl bg-red-50 border-2 border-red-200 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">😢</span>
              <span className="text-red-700 font-bold text-lg">Negative</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-black text-2xl">{sentimentStats.negative.count}</p>
              <p className="text-sm text-red-600 font-bold">{sentimentStats.negative.percent}%</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Rating Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
      >
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Star className="h-6 w-6 text-white fill-white" />
          </div>
          Rating Distribution
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = ratingDistribution[rating];
            const percent = feedbackCount > 0 ? ((count / feedbackCount) * 100).toFixed(0) : 0;
            const colorScheme = getRatingColorScheme(rating);
            
            return (
              <motion.div
                key={rating}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: rating * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className={`${colorScheme.bg} border-2 ${colorScheme.border} rounded-xl p-4 transition-all duration-300 hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-4 w-4 ${idx < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-bold uppercase ${colorScheme.text}`}>
                      {rating} Star{rating !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${colorScheme.text}`}>{count}</span>
                    <span className="text-xs font-bold text-gray-600">({percent}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, delay: rating * 0.1, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${colorScheme.bar}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackAnalytics;
