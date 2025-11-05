import { motion } from "framer-motion";
import { Clock } from "lucide-react";

/**
 * Engagement Checkpoints Component
 * Displays upcoming training sessions, meetings, and milestone reminders
 */
export const EngagementCheckpoints = () => {
  const checkpoints = [
    {
      id: 1,
      title: "Kitchen quarterly skills audit",
      detail: "Scheduled for Friday · Chef Martinez leading practical assessment",
      colorFrom: "from-purple-50",
      colorTo: "to-indigo-50",
      border: "border-purple-200",
      delay: 0.4,
    },
    {
      id: 2,
      title: "Front desk empathy workshop",
      detail: "Wednesday 3 PM · Guest relations team with 92% attendance confirmed",
      colorFrom: "from-cyan-50",
      colorTo: "to-blue-50",
      border: "border-cyan-200",
      delay: 0.45,
    },
    {
      id: 3,
      title: "Maintenance safety refresh",
      detail: "All technicians to complete digital checklist before end of week",
      colorFrom: "from-orange-50",
      colorTo: "to-amber-50",
      border: "border-orange-200",
      delay: 0.5,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4"
    >
      <div>
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-indigo-500" />
          Engagement Checkpoints
        </h2>
        <p className="text-sm text-gray-600 font-medium mt-1">
          Upcoming 1:1s, training, and milestone reminders
        </p>
      </div>
      <ul className="space-y-3 text-sm">
        {checkpoints.map((checkpoint) => (
          <motion.li
            key={checkpoint.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: checkpoint.delay }}
            className={`bg-gradient-to-br ${checkpoint.colorFrom} ${checkpoint.colorTo} border-2 ${checkpoint.border} rounded-xl p-4 hover:shadow-md transition-all duration-300`}
          >
            <p className="font-bold text-gray-900">{checkpoint.title}</p>
            <p className="text-xs text-gray-600 font-medium mt-1">{checkpoint.detail}</p>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};
