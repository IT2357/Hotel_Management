import { motion } from "framer-motion";
import { MessageCircle, Clock, CheckCircle, Star } from "lucide-react";

/**
 * Stats cards displaying feedback metrics
 */
const FeedbackStatsCards = ({ 
  totalCount, 
  pendingCount, 
  respondedCount, 
  averageRating 
}) => {
  const stats = [
    {
      icon: MessageCircle,
      value: totalCount,
      label: "Total Reviews",
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50",
      borderColor: "border-indigo-200"
    },
    {
      icon: Clock,
      value: pendingCount,
      label: "Pending",
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200"
    },
    {
      icon: CheckCircle,
      value: respondedCount,
      label: "Responded",
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50",
      borderColor: "border-emerald-200"
    },
    {
      icon: Star,
      value: averageRating,
      label: "Avg Rating",
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      iconFill: true
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
            className={`bg-gradient-to-br ${stat.bgGradient} rounded-xl border-2 ${stat.borderColor} p-5 shadow-md hover:shadow-lg transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                <Icon className={`h-6 w-6 text-white ${stat.iconFill ? 'fill-white' : ''}`} />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
              {stat.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FeedbackStatsCards;
